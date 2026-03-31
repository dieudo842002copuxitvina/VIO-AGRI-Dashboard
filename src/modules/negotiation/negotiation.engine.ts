import { getSupabaseServerClient } from '@/lib/supabase/server'
import { asRecord, toIsoTimestamp, toSafeNumber, toSafeText } from '@/lib/safe-data'
import { logPlatformEvent } from '@/modules/analytics/analytics.service'
import { getListingById, updateListingStatus } from '@/modules/listings/listings.service'
import { updateTrustScore } from '@/modules/trust/trust.service'
import type {
  CreateNegotiationInput,
  NegotiationRecord,
  NegotiationStatus,
  RespondNegotiationInput,
} from '@/modules/negotiation/negotiation.types'

function normalizeNegotiationStatus(value: unknown): NegotiationStatus {
  const safeValue = toSafeText(value, 'pending').toLowerCase()

  if (safeValue === 'accepted' || safeValue === 'rejected') {
    return safeValue
  }

  return 'pending'
}

export function normalizeNegotiation(raw: unknown): NegotiationRecord {
  const record = asRecord(raw)

  return {
    id: toSafeText(record?.id, `negotiation-${Date.now()}`),
    listing_id: toSafeText(record?.listing_id, ''),
    buyer_id: toSafeText(record?.buyer_id, ''),
    seller_id: toSafeText(record?.seller_id, ''),
    offered_price: toSafeNumber(record?.offered_price, 0),
    status: normalizeNegotiationStatus(record?.status),
    note: toSafeText(record?.note, ''),
    commodity: toSafeText(record?.commodity, 'Market commodity'),
    region: toSafeText(record?.region, 'Unknown region'),
    listing_title: toSafeText(record?.listing_title, 'Listing negotiation'),
    created_at: toSafeText(record?.created_at, '') || null,
    updated_at: toSafeText(record?.updated_at, '') || null,
  }
}

export async function getNegotiations(filters: {
  listing_id?: string
  buyer_id?: string
  seller_id?: string
  limit?: number
}): Promise<NegotiationRecord[]> {
  try {
    const supabase = getSupabaseServerClient()
    let query = supabase
      .from('negotiations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(100, Number(filters.limit ?? 20))))

    if (toSafeText(filters.listing_id, '')) {
      query = query.eq('listing_id', filters.listing_id)
    }

    if (toSafeText(filters.buyer_id, '')) {
      query = query.eq('buyer_id', filters.buyer_id)
    }

    if (toSafeText(filters.seller_id, '')) {
      query = query.eq('seller_id', filters.seller_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Negotiation] Failed to fetch negotiations', { error: error.message })
      return []
    }

    return (data || []).map((item) => normalizeNegotiation(item))
  } catch (error) {
    console.error('[Negotiation] Unexpected fetch error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

export async function createNegotiation(input: CreateNegotiationInput): Promise<NegotiationRecord | null> {
  const listingId = toSafeText(input.listing_id, '')
  const buyerId = toSafeText(input.buyer_id, '')
  const offeredPrice = toSafeNumber(input.offered_price, 0)

  if (!listingId || !buyerId || offeredPrice <= 0) {
    return null
  }

  const listing = await getListingById(listingId)

  if (!listing) {
    return null
  }

  const sellerId = toSafeText(input.seller_id, listing.seller_id)

  if (!sellerId || sellerId === buyerId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('negotiations')
      .insert({
        listing_id: listing.id,
        buyer_id: buyerId,
        seller_id: sellerId,
        offered_price: offeredPrice,
        status: 'pending',
        note: toSafeText(input.note, ''),
        commodity: listing.commodity,
        region: listing.region,
        listing_title: listing.title,
      })
      .select('*')
      .maybeSingle()

    if (error || !data) {
      console.error('[Negotiation] Failed to create negotiation', {
        error: error?.message,
        listingId,
        buyerId,
      })
      return null
    }

    const negotiation = normalizeNegotiation(data)

    await logPlatformEvent({
      event_name: 'negotiation_created',
      user_id: buyerId,
      entity_type: 'negotiation',
      entity_id: negotiation.id,
      metadata: {
        listing_id: negotiation.listing_id,
        seller_id: negotiation.seller_id,
        offered_price: negotiation.offered_price,
      },
    })

    return negotiation
  } catch (error) {
    console.error('[Negotiation] Unexpected create error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function respondToNegotiation(input: RespondNegotiationInput): Promise<NegotiationRecord | null> {
  const negotiationId = toSafeText(input.negotiation_id, '')
  const nextStatus = normalizeNegotiationStatus(input.status)

  if (!negotiationId || (nextStatus !== 'accepted' && nextStatus !== 'rejected')) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('negotiations')
      .update({
        status: nextStatus,
        note: toSafeText(input.note, ''),
        updated_at: toIsoTimestamp(new Date()),
      })
      .eq('id', negotiationId)
      .select('*')
      .maybeSingle()

    if (error || !data) {
      console.error('[Negotiation] Failed to respond to negotiation', {
        negotiationId,
        error: error?.message,
      })
      return null
    }

    const negotiation = normalizeNegotiation(data)

    if (nextStatus === 'accepted') {
      await updateListingStatus(negotiation.listing_id, 'matched')
    } else if (nextStatus === 'rejected') {
      await updateTrustScore(negotiation.seller_id, 'NEGOTIATION_REJECTED', -2)
    }

    await logPlatformEvent({
      event_name: 'negotiation_responded',
      user_id: negotiation.seller_id,
      entity_type: 'negotiation',
      entity_id: negotiation.id,
      metadata: {
        listing_id: negotiation.listing_id,
        buyer_id: negotiation.buyer_id,
        status: negotiation.status,
      },
    })

    return negotiation
  } catch (error) {
    console.error('[Negotiation] Unexpected response error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function getNegotiationById(negotiationId: string): Promise<NegotiationRecord | null> {
  const safeNegotiationId = toSafeText(negotiationId, '')

  if (!safeNegotiationId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('negotiations')
      .select('*')
      .eq('id', safeNegotiationId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return normalizeNegotiation(data)
  } catch {
    return null
  }
}
