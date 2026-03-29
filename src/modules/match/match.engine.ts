import { getSupabaseServerClient } from '@/lib/supabase/server'
import { asRecord, clamp, toSafeBoolean, toSafeNumber, toSafeStringArray, toSafeText } from '@/lib/safe-data'
import { logPlatformEvent } from '@/modules/analytics/analytics.service'
import { getListingById, normalizeListing } from '@/modules/listings/listings.service'
import type {
  BuyerBehaviorSignals,
  BuyerMatch,
  BuyerProfileCandidate,
  ListingCandidate,
} from '@/modules/match/match.types'

const MATCH_CACHE_TTL_MS = 5 * 60 * 1000
const MATCH_SCORE_THRESHOLD = 60
const RECENT_ACTIVITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const PRICE_TOLERANCE_RATIO = 0.2
const VOLUME_TOLERANCE_RATIO = 0.6
const BUYER_QUERY_BATCH_SIZE = 200
const MAX_MATCH_RESULTS = 10

const matchCache = new Map<string, { expiresAt: number; matches: BuyerMatch[] }>()

type RawRecord = Record<string, unknown>

function toSafeRole(value: unknown): BuyerProfileCandidate['role'] {
  const safeRole = toSafeText(value, 'unknown').toLowerCase()

  if (safeRole === 'farmer' || safeRole === 'trader' || safeRole === 'exporter') {
    return safeRole
  }

  return 'unknown'
}

function toComparisonKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeListingCandidate(raw: unknown): ListingCandidate {
  const listing = normalizeListing(raw)

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

function normalizeBuyerProfile(raw: unknown, verifiedMap: Map<string, boolean>): BuyerProfileCandidate {
  const record = asRecord(raw)
  const userId = toSafeText(record?.user_id, 'unknown-user')
  const verifiedFromProfile = toSafeBoolean(record?.verified, false)

  return {
    user_id: userId,
    role: toSafeRole(record?.role),
    region: toSafeText(record?.region, 'Unknown region'),
    interests: toSafeStringArray(record?.interests),
    trust_score: clamp(toSafeNumber(record?.trust_score, 50), 0, 100),
    verified: verifiedFromProfile || verifiedMap.get(userId) === true,
    updated_at: toSafeText(record?.updated_at, '') || null,
  }
}

function createEmptyBehaviorSignals(userId: string): BuyerBehaviorSignals {
  return {
    user_id: userId,
    active_listing_count: 0,
    recent_listing_count: 0,
    same_commodity_listing_count: 0,
    average_price_for_commodity: null,
    average_quantity_for_commodity: null,
    last_activity_at: null,
  }
}

function isRecentTimestamp(value: string | null): boolean {
  if (!value) {
    return false
  }

  const time = new Date(value).getTime()

  if (Number.isNaN(time)) {
    return false
  }

  return Date.now() - time <= RECENT_ACTIVITY_WINDOW_MS
}

function isActiveStatus(status: string): boolean {
  return status === 'active' || status === 'open'
}

function tokensForRegion(region: string): string[] {
  const stopWords = new Set(['province', 'city', 'district', 'region', 'ward', 'commune'])

  return toComparisonKey(region)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWords.has(token))
}

function isNearbyRegion(listingRegion: string, buyerRegion: string): boolean {
  const listingKey = toComparisonKey(listingRegion)
  const buyerKey = toComparisonKey(buyerRegion)

  if (!listingKey || !buyerKey) {
    return false
  }

  if (listingKey === buyerKey) {
    return true
  }

  const listingTokens = tokensForRegion(listingRegion)
  const buyerTokens = tokensForRegion(buyerRegion)

  return listingTokens.some((token) => buyerTokens.includes(token))
}

function includesCommodityMatch(value: string, listingCommodity: string): boolean {
  const candidateKey = toComparisonKey(value)
  const commodityKey = toComparisonKey(listingCommodity)

  if (!candidateKey || !commodityKey) {
    return false
  }

  return candidateKey.includes(commodityKey) || commodityKey.includes(candidateKey)
}

function hasCommodityInterest(buyer: BuyerProfileCandidate, listingCommodity: string): boolean {
  return buyer.interests.some((interest) => includesCommodityMatch(interest, listingCommodity))
}

function isPriceCompatible(listingPrice: number, buyerPrice: number | null): boolean {
  if (listingPrice <= 0 || !buyerPrice || buyerPrice <= 0) {
    return false
  }

  const delta = Math.abs(listingPrice - buyerPrice)
  const ratio = delta / Math.max(listingPrice, buyerPrice)

  return ratio <= PRICE_TOLERANCE_RATIO
}

function isVolumeCompatible(listingQuantity: number, buyerQuantity: number | null): boolean {
  if (listingQuantity <= 0 || !buyerQuantity || buyerQuantity <= 0) {
    return true
  }

  const delta = Math.abs(listingQuantity - buyerQuantity)
  const ratio = delta / Math.max(listingQuantity, buyerQuantity)

  return ratio <= VOLUME_TOLERANCE_RATIO
}

function getCachedMatches(listingId: string): BuyerMatch[] | null {
  const cached = matchCache.get(listingId)

  if (!cached) {
    return null
  }

  if (cached.expiresAt <= Date.now()) {
    matchCache.delete(listingId)
    return null
  }

  return cached.matches
}

function setCachedMatches(listingId: string, matches: BuyerMatch[]): void {
  matchCache.set(listingId, {
    expiresAt: Date.now() + MATCH_CACHE_TTL_MS,
    matches,
  })
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function fetchListingById(listingId: string): Promise<ListingCandidate | null> {
  const listing = await getListingById(listingId)
  return listing ? normalizeListingCandidate(listing) : null
}

async function fetchVerificationStatuses(buyerIds: string[]): Promise<Map<string, boolean>> {
  const verificationMap = new Map<string, boolean>()

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('user_verification')
      .select('user_id, verified_status')
      .in('user_id', buyerIds)

    if (error) {
      return verificationMap
    }

    for (const item of data || []) {
      const record = asRecord(item)
      const userId = toSafeText(record?.user_id, '')
      const verifiedStatus = toSafeText(record?.verified_status, '').toLowerCase()

      if (userId) {
        verificationMap.set(userId, verifiedStatus === 'verified' || verifiedStatus === 'approved')
      }
    }
  } catch {
    return verificationMap
  }

  return verificationMap
}

async function fetchBuyerProfiles(excludedUserId: string): Promise<BuyerProfileCandidate[]> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .neq('user_id', excludedUserId)
    .in('role', ['trader', 'exporter'])
    .limit(2000)

  if (error) {
    console.error('[MatchEngine] Failed to fetch buyer profiles', {
      excludedUserId,
      error: error.message,
    })
    return []
  }

  const buyerIds = (data || [])
    .map((item) => toSafeText((item as RawRecord).user_id, ''))
    .filter((item) => item.length > 0)
  const verifiedMap = await fetchVerificationStatuses(buyerIds)

  return (data || [])
    .map((item) => normalizeBuyerProfile(item, verifiedMap))
    .filter((item) => item.user_id !== 'unknown-user')
}

async function fetchBuyerBehaviorSignals(
  buyerIds: string[],
  listingCommodity: string
): Promise<Map<string, BuyerBehaviorSignals>> {
  const supabase = getSupabaseServerClient()
  const signalsMap = new Map<string, BuyerBehaviorSignals>()
  const priceSums = new Map<string, { total: number; count: number }>()
  const quantitySums = new Map<string, { total: number; count: number }>()

  buyerIds.forEach((buyerId) => {
    signalsMap.set(buyerId, createEmptyBehaviorSignals(buyerId))
  })

  for (const batch of chunkArray(buyerIds, BUYER_QUERY_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from('b2b_listings')
      .select('*, commodities(name, unit)')
      .in('user_id', batch)

    if (error) {
      console.error('[MatchEngine] Failed to fetch buyer activity batch', {
        buyerCount: batch.length,
        error: error.message,
      })
      continue
    }

    for (const rawListing of data || []) {
      const listing = normalizeListingCandidate(rawListing)
      const currentSignals = signalsMap.get(listing.user_id) || createEmptyBehaviorSignals(listing.user_id)
      const activityTimestamp = listing.updated_at || listing.created_at

      if (isActiveStatus(listing.status)) {
        currentSignals.active_listing_count += 1
      }

      if (isRecentTimestamp(activityTimestamp)) {
        currentSignals.recent_listing_count += 1
      }

      if (includesCommodityMatch(listing.commodity, listingCommodity)) {
        currentSignals.same_commodity_listing_count += 1

        if (listing.price_per_unit > 0) {
          const priceTotals = priceSums.get(listing.user_id) || { total: 0, count: 0 }
          priceTotals.total += listing.price_per_unit
          priceTotals.count += 1
          priceSums.set(listing.user_id, priceTotals)
        }

        if (listing.quantity > 0) {
          const quantityTotals = quantitySums.get(listing.user_id) || { total: 0, count: 0 }
          quantityTotals.total += listing.quantity
          quantityTotals.count += 1
          quantitySums.set(listing.user_id, quantityTotals)
        }
      }

      if (!currentSignals.last_activity_at) {
        currentSignals.last_activity_at = activityTimestamp
      } else if (activityTimestamp) {
        const previous = new Date(currentSignals.last_activity_at).getTime()
        const next = new Date(activityTimestamp).getTime()

        if (!Number.isNaN(next) && (Number.isNaN(previous) || next > previous)) {
          currentSignals.last_activity_at = activityTimestamp
        }
      }

      signalsMap.set(listing.user_id, currentSignals)
    }
  }

  for (const [buyerId, signals] of signalsMap.entries()) {
    const priceTotals = priceSums.get(buyerId)
    const quantityTotals = quantitySums.get(buyerId)

    signals.average_price_for_commodity =
      priceTotals && priceTotals.count > 0 ? priceTotals.total / priceTotals.count : null
    signals.average_quantity_for_commodity =
      quantityTotals && quantityTotals.count > 0 ? quantityTotals.total / quantityTotals.count : null
  }

  return signalsMap
}

function scoreTrustSignal(buyer: BuyerProfileCandidate): number {
  const trustBase = Math.round((buyer.trust_score / 100) * 8)
  const verificationBonus = buyer.verified ? 2 : 0
  return clamp(trustBase + verificationBonus, 0, 10)
}

function scoreBuyerMatch(
  listing: ListingCandidate,
  buyer: BuyerProfileCandidate,
  signals: BuyerBehaviorSignals
): BuyerMatch | null {
  let score = 0
  const matchReasons: string[] = []

  const commodityMatch = hasCommodityInterest(buyer, listing.commodity) || signals.same_commodity_listing_count > 0
  if (commodityMatch) {
    score += 40
    matchReasons.push('Same commodity')
  }

  if (isNearbyRegion(listing.region, buyer.region)) {
    score += 20
    matchReasons.push('Nearby region')
  }

  const priceCompatible = isPriceCompatible(listing.price_per_unit, signals.average_price_for_commodity)
  const volumeCompatible = isVolumeCompatible(listing.quantity, signals.average_quantity_for_commodity)
  if (priceCompatible && volumeCompatible) {
    score += 20
    matchReasons.push('Price compatible')
  }

  const activeBuyer =
    signals.active_listing_count > 0 ||
    signals.recent_listing_count > 0 ||
    isRecentTimestamp(signals.last_activity_at) ||
    isRecentTimestamp(buyer.updated_at)
  if (activeBuyer) {
    score += 10
    matchReasons.push('Active buyer')
  }

  const trustSignal = scoreTrustSignal(buyer)
  if (trustSignal > 0) {
    score += trustSignal
    matchReasons.push(buyer.verified ? 'Verified buyer' : 'Trusted buyer')
  }

  if (score <= MATCH_SCORE_THRESHOLD) {
    return null
  }

  return {
    buyer_id: buyer.user_id,
    score,
    match_reasons: matchReasons,
    buyer_role: buyer.role === 'trader' || buyer.role === 'exporter' ? buyer.role : 'unknown',
    buyer_region: buyer.region,
    trust_score: buyer.trust_score,
    verified: buyer.verified,
    last_activity_at: signals.last_activity_at || buyer.updated_at,
  }
}

export async function matchBuyersForListing(listing: ListingCandidate): Promise<BuyerMatch[]> {
  if (!listing.id || !listing.user_id || !listing.commodity || !isActiveStatus(listing.status)) {
    return []
  }

  const cachedMatches = getCachedMatches(listing.id)
  if (cachedMatches) {
    console.info('[MatchEngine] Returning cached matches', {
      listingId: listing.id,
      matches: cachedMatches.length,
    })
    return cachedMatches
  }

  const buyerProfiles = await fetchBuyerProfiles(listing.user_id)
  if (buyerProfiles.length === 0) {
    console.info('[MatchEngine] No buyer profiles available', { listingId: listing.id })
    return []
  }

  const buyerSignals = await fetchBuyerBehaviorSignals(
    buyerProfiles.map((buyer) => buyer.user_id),
    listing.commodity
  )

  const matches = buyerProfiles
    .map((buyer) =>
      scoreBuyerMatch(
        listing,
        buyer,
        buyerSignals.get(buyer.user_id) || createEmptyBehaviorSignals(buyer.user_id)
      )
    )
    .filter((match): match is BuyerMatch => match !== null)
    .sort((left, right) => {
      const scoreDelta = right.score - left.score

      if (scoreDelta !== 0) {
        return scoreDelta
      }

      const verifiedDelta = Number(right.verified) - Number(left.verified)
      if (verifiedDelta !== 0) {
        return verifiedDelta
      }

      const trustDelta = (right.trust_score || 0) - (left.trust_score || 0)
      if (trustDelta !== 0) {
        return trustDelta
      }

      return left.buyer_id.localeCompare(right.buyer_id)
    })
    .slice(0, MAX_MATCH_RESULTS)

  setCachedMatches(listing.id, matches)

  await logPlatformEvent({
    event_name: 'matches_generated',
    user_id: listing.user_id,
    entity_type: 'listing',
    entity_id: listing.id,
    metadata: {
      listing_commodity: listing.commodity,
      returned_matches: matches.length,
      top_match_ids: matches.slice(0, 3).map((item) => item.buyer_id),
    },
  })

  console.info('[MatchEngine] Match results generated', {
    listingId: listing.id,
    sellerId: listing.user_id,
    listingCommodity: listing.commodity,
    totalProfiles: buyerProfiles.length,
    returnedMatches: matches.length,
    topMatches: matches.slice(0, 3),
  })

  return matches
}

export async function findBuyerMatchesForListingId(listingId: string): Promise<BuyerMatch[]> {
  const listing = await fetchListingById(listingId)

  if (!listing) {
    console.warn('[MatchEngine] Listing not found', { listingId })
    return []
  }

  return matchBuyersForListing(listing)
}

export function getMatchScoreThreshold(): number {
  return MATCH_SCORE_THRESHOLD
}
