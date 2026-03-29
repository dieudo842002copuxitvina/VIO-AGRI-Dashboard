import { logPlatformEvent } from '@/modules/analytics/analytics.service'
import { getListingById } from '@/modules/listings/listings.service'
import type { Listing } from '@/modules/listings/listings.types'
import { matchBuyersForListing } from '@/modules/match/match.engine'
import type { BuyerMatch, ListingCandidate } from '@/modules/match/match.types'

const MINIMUM_LIQUIDITY_BUYERS = 3
const FALLBACK_ACTIVITY_DAYS = [2, 5, 9]

interface FallbackBuyerTemplate {
  seed: string
  role: 'trader' | 'exporter'
  regionSuffix: string
  trustScore: number
  verified: boolean
  matchReasons: string[]
}

interface LiquidityBootstrapOptions {
  notify?: boolean
  logEvents?: boolean
}

export interface LiquidityBootstrapResult {
  listing_id: string
  matches: BuyerMatch[]
  real_matches: number
  fallback_matches: number
  fulfilled: boolean
  minimum_required: number
  strategy: 'live' | 'hybrid' | 'fallback_only' | 'unavailable'
  notified_buyer_ids: string[]
}

const FALLBACK_BUYERS: FallbackBuyerTemplate[] = [
  {
    seed: 'verified-export-desk',
    role: 'exporter',
    regionSuffix: 'Export Desk',
    trustScore: 94,
    verified: true,
    matchReasons: ['Cold-start liquidity', 'Verified buyer priority', 'Export-ready network'],
  },
  {
    seed: 'regional-trader-network',
    role: 'trader',
    regionSuffix: 'Trade Network',
    trustScore: 86,
    verified: true,
    matchReasons: ['Cold-start liquidity', 'Active regional trader', 'Fast response desk'],
  },
  {
    seed: 'bulk-demand-pool',
    role: 'exporter',
    regionSuffix: 'Bulk Demand Pool',
    trustScore: 82,
    verified: false,
    matchReasons: ['Cold-start liquidity', 'Bulk demand signal', 'Commodity acquisition pool'],
  },
]

function normalizeListingInput(listing: ListingCandidate | Listing): ListingCandidate {
  return {
    id: listing.id,
    user_id: listing.user_id,
    commodity: listing.commodity,
    quantity: listing.quantity,
    price_per_unit: listing.price_per_unit,
    region: listing.region,
    status: listing.status,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
  }
}

function toUniqueReasons(reasons: string[]): string[] {
  return Array.from(
    new Set(reasons.filter((reason) => typeof reason === 'string' && reason.trim().length > 0))
  )
}

function getActivityScore(lastActivityAt: string | null | undefined): number {
  if (!lastActivityAt) {
    return 0
  }

  const timestamp = new Date(lastActivityAt).getTime()

  if (Number.isNaN(timestamp)) {
    return 0
  }

  const ageMs = Date.now() - timestamp
  const oneDayMs = 24 * 60 * 60 * 1000

  if (ageMs <= 7 * oneDayMs) {
    return 100
  }

  if (ageMs <= 30 * oneDayMs) {
    return 80
  }

  if (ageMs <= 90 * oneDayMs) {
    return 55
  }

  if (ageMs <= 180 * oneDayMs) {
    return 25
  }

  return 0
}

function createFallbackBuyerMatch(
  listing: ListingCandidate,
  template: FallbackBuyerTemplate,
  index: number
): BuyerMatch {
  const activityDate = new Date(
    Date.now() - FALLBACK_ACTIVITY_DAYS[index % FALLBACK_ACTIVITY_DAYS.length] * 24 * 60 * 60 * 1000
  )
  const activityScore = getActivityScore(activityDate.toISOString())
  const trustComponent = Math.round(template.trustScore * 0.25)
  const activityComponent = Math.round(activityScore * 0.15)
  const verifiedBonus = template.verified ? 8 : 0
  const fallbackScore = Math.min(96, 62 + trustComponent + activityComponent + verifiedBonus)

  return {
    buyer_id: `fallback-${listing.id}-${template.seed}`,
    score: fallbackScore,
    match_reasons: toUniqueReasons([
      ...template.matchReasons,
      `Interest in ${listing.commodity || 'commodity'}`,
      listing.region ? `Coverage near ${listing.region}` : 'Regional coverage available',
    ]),
    buyer_role: template.role,
    buyer_region: listing.region ? `${listing.region} ${template.regionSuffix}` : template.regionSuffix,
    trust_score: template.trustScore,
    verified: template.verified,
    last_activity_at: activityDate.toISOString(),
    activity_score: activityScore,
    is_fallback: true,
    notification_status: 'skipped',
  }
}

function rankLiquidityMatches(matches: BuyerMatch[]): BuyerMatch[] {
  return [...matches]
    .map((match) => ({
      ...match,
      activity_score:
        typeof match.activity_score === 'number' ? match.activity_score : getActivityScore(match.last_activity_at),
      match_reasons: toUniqueReasons([
        ...(Array.isArray(match.match_reasons) ? match.match_reasons : []),
        match.verified ? 'Verified buyer priority' : 'Trust-ranked buyer',
      ]),
    }))
    .sort((left, right) => {
      const fallbackDelta = Number(Boolean(left.is_fallback)) - Number(Boolean(right.is_fallback))
      if (fallbackDelta !== 0) {
        return fallbackDelta
      }

      const verifiedDelta = Number(Boolean(right.verified)) - Number(Boolean(left.verified))
      if (verifiedDelta !== 0) {
        return verifiedDelta
      }

      const trustDelta = (right.trust_score || 0) - (left.trust_score || 0)
      if (trustDelta !== 0) {
        return trustDelta
      }

      const activityDelta = (right.activity_score || 0) - (left.activity_score || 0)
      if (activityDelta !== 0) {
        return activityDelta
      }

      const scoreDelta = right.score - left.score
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      return left.buyer_id.localeCompare(right.buyer_id)
    })
}

async function sendMockNotifications(
  listing: ListingCandidate,
  matches: BuyerMatch[]
): Promise<BuyerMatch[]> {
  const notifiedMatches = await Promise.all(
    matches.map(async (match) => {
      await logPlatformEvent({
        event_name: 'buyer_notification_mock_sent',
        user_id: match.buyer_id,
        entity_type: 'listing',
        entity_id: listing.id,
        metadata: {
          listing_commodity: listing.commodity,
          listing_region: listing.region,
          buyer_id: match.buyer_id,
          buyer_role: match.buyer_role || 'unknown',
          buyer_verified: Boolean(match.verified),
          fallback: Boolean(match.is_fallback),
        },
      })

      console.info('[Liquidity] Mock buyer notification sent', {
        listingId: listing.id,
        buyerId: match.buyer_id,
        fallback: Boolean(match.is_fallback),
      })

      return {
        ...match,
        notification_status: 'mock_sent' as const,
      }
    })
  )

  return notifiedMatches
}

export async function bootstrapListingLiquidity(
  listingInput: ListingCandidate | Listing,
  options: LiquidityBootstrapOptions = {}
): Promise<LiquidityBootstrapResult> {
  const listing = normalizeListingInput(listingInput)
  const shouldNotify = options.notify !== false
  const shouldLogEvents = options.logEvents !== false

  if (!listing.id || !listing.user_id || !listing.commodity) {
    return {
      listing_id: listing.id || 'unknown-listing',
      matches: [],
      real_matches: 0,
      fallback_matches: 0,
      fulfilled: false,
      minimum_required: MINIMUM_LIQUIDITY_BUYERS,
      strategy: 'unavailable',
      notified_buyer_ids: [],
    }
  }

  const liveMatches = await matchBuyersForListing(listing)
  const rankedLiveMatches = rankLiquidityMatches(
    liveMatches.slice(0, MINIMUM_LIQUIDITY_BUYERS).map((match) => ({
      ...match,
      is_fallback: false,
      notification_status: 'skipped',
    }))
  )

  const missingMatches = Math.max(0, MINIMUM_LIQUIDITY_BUYERS - rankedLiveMatches.length)
  const fallbackMatches = FALLBACK_BUYERS.slice(0, missingMatches).map((template, index) =>
    createFallbackBuyerMatch(listing, template, index)
  )

  const rankedMatches = rankLiquidityMatches([...rankedLiveMatches, ...fallbackMatches]).slice(
    0,
    MINIMUM_LIQUIDITY_BUYERS
  )
  const finalMatches = shouldNotify ? await sendMockNotifications(listing, rankedMatches) : rankedMatches
  const realMatchesCount = finalMatches.filter((match) => !match.is_fallback).length
  const fallbackMatchesCount = finalMatches.filter((match) => Boolean(match.is_fallback)).length

  if (shouldLogEvents) {
    await logPlatformEvent({
      event_name: 'listing_liquidity_bootstrapped',
      user_id: listing.user_id,
      entity_type: 'listing',
      entity_id: listing.id,
      metadata: {
        listing_commodity: listing.commodity,
        listing_region: listing.region,
        real_matches: realMatchesCount,
        fallback_matches: fallbackMatchesCount,
        matched_buyer_ids: finalMatches.map((match) => match.buyer_id),
        notifications_sent: shouldNotify,
      },
    })
  }

  return {
    listing_id: listing.id,
    matches: finalMatches,
    real_matches: realMatchesCount,
    fallback_matches: fallbackMatchesCount,
    fulfilled: finalMatches.length >= MINIMUM_LIQUIDITY_BUYERS,
    minimum_required: MINIMUM_LIQUIDITY_BUYERS,
    strategy:
      realMatchesCount >= MINIMUM_LIQUIDITY_BUYERS
        ? 'live'
        : realMatchesCount > 0
          ? 'hybrid'
          : 'fallback_only',
    notified_buyer_ids: shouldNotify ? finalMatches.map((match) => match.buyer_id) : [],
  }
}

export async function ensureListingLiquidityById(
  listingId: string,
  options: LiquidityBootstrapOptions = {}
): Promise<LiquidityBootstrapResult> {
  const listing = await getListingById(listingId)

  if (!listing) {
    return {
      listing_id: listingId,
      matches: [],
      real_matches: 0,
      fallback_matches: 0,
      fulfilled: false,
      minimum_required: MINIMUM_LIQUIDITY_BUYERS,
      strategy: 'unavailable',
      notified_buyer_ids: [],
    }
  }

  return bootstrapListingLiquidity(listing, options)
}

export function getMinimumLiquidityBuyers(): number {
  return MINIMUM_LIQUIDITY_BUYERS
}
