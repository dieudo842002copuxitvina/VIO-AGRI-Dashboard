import { getSupabaseServerClient } from '@/lib/supabase/server'
import { asRecord, toSafeNumber, toSafeText } from '@/lib/safe-data'
import { logPlatformEvent } from '@/modules/analytics/analytics.service'
import type { CreateListingInput, Listing, ListingFilters, ListingStatus } from '@/modules/listings/listings.types'

function normalizeListingStatus(value: unknown): ListingStatus {
  const safeValue = toSafeText(value, 'active').toLowerCase()

  if (safeValue === 'closed') {
    return 'closed'
  }

  if (safeValue === 'matched') {
    return 'matched'
  }

  return 'active'
}

export function normalizeListing(raw: unknown): Listing {
  const record = asRecord(raw)
  const commodityRecord = asRecord(record?.commodities)
  const commodity =
    toSafeText(record?.commodity, '') ||
    toSafeText(commodityRecord?.name, '') ||
    'Market commodity'

  const region =
    toSafeText(record?.region, '') ||
    toSafeText(record?.location, '') ||
    'Unknown region'

  const sellerId =
    toSafeText(record?.seller_id, '') ||
    toSafeText(record?.user_id, '') ||
    'unknown-seller'

  return {
    id: toSafeText(record?.id, `listing-${Date.now()}`),
    seller_id: sellerId,
    user_id: toSafeText(record?.user_id, sellerId),
    title: toSafeText(record?.title, '') || `${commodity} listing`,
    commodity,
    commodity_id: toSafeText(record?.commodity_id, '') || null,
    quantity: toSafeNumber(record?.quantity, 0),
    price_per_unit: toSafeNumber(record?.price_per_unit, 0),
    region,
    description: toSafeText(record?.description, ''),
    status: normalizeListingStatus(record?.status),
    unit: toSafeText(commodityRecord?.unit, 'unit'),
    created_at: toSafeText(record?.created_at, '') || null,
    updated_at: toSafeText(record?.updated_at, '') || null,
  }
}

async function resolveCommodityId(commodity: string, commodityId?: string | null): Promise<string | null> {
  const explicitId = toSafeText(commodityId, '')

  if (explicitId) {
    return explicitId
  }

  const safeCommodity = toSafeText(commodity, '')

  if (!safeCommodity) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('commodities')
      .select('id, name')
      .ilike('name', safeCommodity)
      .limit(1)

    if (error) {
      return null
    }

    const firstRecord = Array.isArray(data) ? data[0] : null
    const record = asRecord(firstRecord)

    return toSafeText(record?.id, '') || null
  } catch {
    return null
  }
}

function matchesCommodity(listing: Listing, commodity: string): boolean {
  const safeCommodity = toSafeText(commodity, '').toLowerCase()

  if (!safeCommodity) {
    return true
  }

  return listing.commodity.toLowerCase().includes(safeCommodity)
}

function matchesRegion(listing: Listing, region: string): boolean {
  const safeRegion = toSafeText(region, '').toLowerCase()

  if (!safeRegion) {
    return true
  }

  return listing.region.toLowerCase().includes(safeRegion)
}

function matchesSeller(listing: Listing, sellerId: string): boolean {
  const safeSellerId = toSafeText(sellerId, '')

  if (!safeSellerId) {
    return true
  }

  return listing.seller_id === safeSellerId || listing.user_id === safeSellerId
}

function matchesStatus(listing: Listing, status: ListingFilters['status']): boolean {
  if (!status) {
    return true
  }

  if (status === 'open') {
    return listing.status === 'active'
  }

  return listing.status === status
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  try {
    const supabase = getSupabaseServerClient()
    const limit = Number.isFinite(filters.limit) ? Math.max(1, Math.min(100, Number(filters.limit))) : 30
    const { data, error } = await supabase
      .from('b2b_listings')
      .select('*, commodities(name, unit)')
      .order('created_at', { ascending: false })
      .limit(Math.max(limit, 50))

    if (error) {
      console.error('[Listings] Failed to fetch listings', { error: error.message })
      return []
    }

    return (data || [])
      .map((item) => normalizeListing(item))
      .filter((item) => matchesCommodity(item, filters.commodity || ''))
      .filter((item) => matchesRegion(item, filters.region || ''))
      .filter((item) => matchesSeller(item, filters.seller_id || ''))
      .filter((item) => matchesStatus(item, filters.status))
      .slice(0, limit)
  } catch (error) {
    console.error('[Listings] Unexpected fetch error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

export async function getListingById(listingId: string): Promise<Listing | null> {
  const safeListingId = toSafeText(listingId, '')

  if (!safeListingId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('b2b_listings')
      .select('*, commodities(name, unit)')
      .eq('id', safeListingId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return normalizeListing(data)
  } catch (error) {
    console.error('[Listings] Failed to fetch listing by id', {
      listingId: safeListingId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function createListing(input: CreateListingInput): Promise<Listing | null> {
  const sellerId = toSafeText(input.seller_id, '')
  const commodity = toSafeText(input.commodity, '')
  const region = toSafeText(input.region, '')
  const quantity = toSafeNumber(input.quantity, 0)
  const pricePerUnit = toSafeNumber(input.price_per_unit, 0)
  const title = toSafeText(input.title, '') || `${commodity || 'Commodity'} listing`
  const description = toSafeText(input.description, '')

  if (!sellerId || !commodity || !region || quantity <= 0 || pricePerUnit <= 0) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const commodityId = await resolveCommodityId(commodity, input.commodity_id)
    const modernPayload = {
      seller_id: sellerId,
      user_id: sellerId,
      title,
      commodity,
      commodity_id: commodityId,
      quantity,
      price_per_unit: pricePerUnit,
      region,
      location: region,
      description,
      status: 'active',
    }

    const modernResult = await supabase
      .from('b2b_listings')
      .insert(modernPayload)
      .select('*, commodities(name, unit)')
      .maybeSingle()

    if (!modernResult.error && modernResult.data) {
      const createdListing = normalizeListing(modernResult.data)
      await logPlatformEvent({
        event_name: 'listing_created',
        user_id: sellerId,
        entity_type: 'listing',
        entity_id: createdListing.id,
        metadata: {
          commodity: createdListing.commodity,
          region: createdListing.region,
          price_per_unit: createdListing.price_per_unit,
        },
      })
      return createdListing
    }

    const legacyPayload = {
      user_id: sellerId,
      title,
      commodity_id: commodityId,
      quantity,
      price_per_unit: pricePerUnit,
      location: region,
      description,
      status: 'open',
    }

    const legacyResult = await supabase
      .from('b2b_listings')
      .insert(legacyPayload)
      .select('*, commodities(name, unit)')
      .maybeSingle()

    if (legacyResult.error || !legacyResult.data) {
      console.error('[Listings] Failed to create listing', {
        modernError: modernResult.error?.message,
        legacyError: legacyResult.error?.message,
      })
      return null
    }

    const createdListing = normalizeListing({
      ...legacyResult.data,
      seller_id: sellerId,
      commodity,
      region,
      location: region,
    })

    await logPlatformEvent({
      event_name: 'listing_created',
      user_id: sellerId,
      entity_type: 'listing',
      entity_id: createdListing.id,
      metadata: {
        commodity: createdListing.commodity,
        region: createdListing.region,
        price_per_unit: createdListing.price_per_unit,
      },
    })

    return createdListing
  } catch (error) {
    console.error('[Listings] Unexpected create error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function updateListingStatus(listingId: string, status: ListingStatus): Promise<Listing | null> {
  const safeListingId = toSafeText(listingId, '')

  if (!safeListingId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const statusForLegacy = status === 'active' ? 'open' : status

    const { data, error } = await supabase
      .from('b2b_listings')
      .update({ status: statusForLegacy })
      .eq('id', safeListingId)
      .select('*, commodities(name, unit)')
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return normalizeListing(data)
  } catch (error) {
    console.error('[Listings] Failed to update listing status', {
      listingId: safeListingId,
      status,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}
