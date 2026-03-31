import { getSupabaseServerClient } from '@/lib/supabase/server'
import { asRecord, toIsoTimestamp, toSafeNumber, toSafeText } from '@/lib/safe-data'
import { logPlatformEvent } from '@/modules/analytics/analytics.service'
import { getNegotiationById } from '@/modules/negotiation/negotiation.engine'
import { updateListingStatus } from '@/modules/listings/listings.service'
import { updateTrustScore } from '@/modules/trust/trust.service'
import type { DeliveryStatus, TransactionRecord, TransactionStatus } from '@/modules/transaction/transaction.types'

function normalizeTransactionStatus(value: unknown): TransactionStatus {
  const safeValue = toSafeText(value, 'pending').toLowerCase()

  if (safeValue === 'escrow' || safeValue === 'released') {
    return safeValue
  }

  return 'pending'
}

function normalizeDeliveryStatus(value: unknown): DeliveryStatus {
  const safeValue = toSafeText(value, 'awaiting_dispatch').toLowerCase()

  if (safeValue === 'in_transit' || safeValue === 'delivered' || safeValue === 'completed') {
    return safeValue
  }

  return 'awaiting_dispatch'
}

function normalizeTransaction(raw: unknown, order?: unknown): TransactionRecord {
  const record = asRecord(raw)
  const orderRecord = asRecord(order)

  return {
    id: toSafeText(record?.id, `transaction-${Date.now()}`),
    negotiation_id: toSafeText(record?.negotiation_id, ''),
    listing_id: toSafeText(record?.listing_id, ''),
    buyer_id: toSafeText(record?.buyer_id, ''),
    seller_id: toSafeText(record?.seller_id, ''),
    amount: toSafeNumber(record?.amount, 0),
    status: normalizeTransactionStatus(record?.status),
    delivery_status: normalizeDeliveryStatus(orderRecord?.delivery_status),
    logistics_info: toSafeText(orderRecord?.logistics_info, ''),
    created_at: toSafeText(record?.created_at, '') || null,
    updated_at: toSafeText(record?.updated_at, '') || null,
  }
}

async function getOrderByTransactionId(transactionId: string): Promise<Record<string, unknown> | null> {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return asRecord(data)
  } catch {
    return null
  }
}

export async function getTransactionById(transactionId: string): Promise<TransactionRecord | null> {
  const safeTransactionId = toSafeText(transactionId, '')

  if (!safeTransactionId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', safeTransactionId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    const order = await getOrderByTransactionId(safeTransactionId)
    return normalizeTransaction(data, order)
  } catch (error) {
    console.error('[Transaction] Failed to fetch transaction', {
      transactionId: safeTransactionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function getTransactionByNegotiationId(negotiationId: string): Promise<TransactionRecord | null> {
  const safeNegotiationId = toSafeText(negotiationId, '')

  if (!safeNegotiationId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('negotiation_id', safeNegotiationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    const transactionId = toSafeText((data as Record<string, unknown>).id, '')
    const order = await getOrderByTransactionId(transactionId)
    return normalizeTransaction(data, order)
  } catch {
    return null
  }
}

async function logEscrowEvent(transactionId: string, event: string, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = getSupabaseServerClient()
    await supabase.from('escrow_logs').insert({
      transaction_id: transactionId,
      event,
      metadata,
    })
  } catch (error) {
    console.error('[Transaction] Failed to log escrow event', {
      transactionId,
      event,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function createEscrowTransaction(input: {
  negotiation_id: string
  amount?: number
}): Promise<TransactionRecord | null> {
  const negotiationId = toSafeText(input.negotiation_id, '')

  if (!negotiationId) {
    return null
  }

  const existing = await getTransactionByNegotiationId(negotiationId)

  if (existing) {
    return existing
  }

  const negotiation = await getNegotiationById(negotiationId)

  if (!negotiation || negotiation.status !== 'accepted') {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const amount = toSafeNumber(input.amount, negotiation.offered_price)
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        negotiation_id: negotiation.id,
        listing_id: negotiation.listing_id,
        buyer_id: negotiation.buyer_id,
        seller_id: negotiation.seller_id,
        amount,
        status: 'escrow',
      })
      .select('*')
      .maybeSingle()

    if (error || !data) {
      console.error('[Transaction] Failed to create escrow transaction', {
        negotiationId,
        error: error?.message,
      })
      return null
    }

    const transactionId = toSafeText((data as Record<string, unknown>).id, '')

    await supabase.from('orders').insert({
      transaction_id: transactionId,
      delivery_status: 'awaiting_dispatch',
      logistics_info: '',
    })

    const transaction = await getTransactionById(transactionId)

    if (transaction) {
      await logPlatformEvent({
        event_name: 'transaction_created',
        user_id: transaction.buyer_id,
        entity_type: 'transaction',
        entity_id: transaction.id,
        metadata: {
          negotiation_id: transaction.negotiation_id,
          listing_id: transaction.listing_id,
          amount: transaction.amount,
          status: transaction.status,
        },
      })
      await logEscrowEvent(transaction.id, 'ESCROW_CREATED', { amount: transaction.amount })
    }

    return transaction
  } catch (error) {
    console.error('[Transaction] Unexpected create error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function updateFulfillment(input: {
  transaction_id: string
  delivery_status: DeliveryStatus
  logistics_info?: string
}): Promise<TransactionRecord | null> {
  const transactionId = toSafeText(input.transaction_id, '')

  if (!transactionId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('orders')
      .update({
        delivery_status: input.delivery_status,
        logistics_info: toSafeText(input.logistics_info, ''),
        updated_at: toIsoTimestamp(new Date()),
      })
      .eq('transaction_id', transactionId)

    if (error) {
      console.error('[Transaction] Failed to update fulfillment', {
        transactionId,
        error: error.message,
      })
      return null
    }

    const transaction = await getTransactionById(transactionId)

    if (transaction) {
      await logPlatformEvent({
        event_name: 'fulfillment_updated',
        user_id: transaction.seller_id,
        entity_type: 'transaction',
        entity_id: transaction.id,
        metadata: {
          delivery_status: transaction.delivery_status,
          logistics_info: transaction.logistics_info,
        },
      })
      await logEscrowEvent(transaction.id, 'FULFILLMENT_UPDATED', { delivery_status: transaction.delivery_status })
    }

    return transaction
  } catch (error) {
    console.error('[Transaction] Unexpected fulfillment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function releaseEscrowTransaction(transactionId: string): Promise<TransactionRecord | null> {
  const safeTransactionId = toSafeText(transactionId, '')

  if (!safeTransactionId) {
    return null
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'released',
        updated_at: toIsoTimestamp(new Date()),
      })
      .eq('id', safeTransactionId)
      .select('*')
      .maybeSingle()

    if (error || !data) {
      console.error('[Transaction] Failed to release escrow', {
        transactionId: safeTransactionId,
        error: error?.message,
      })
      return null
    }

    const transactionAmount = toSafeNumber(data.amount, 0)
    const feePercentage = Math.random() * (0.05 - 0.02) + 0.02 // Random fee between 2% and 5%
    const platformFee = transactionAmount * feePercentage

    await supabase
      .from('transactions')
      .update({ platform_fee: platformFee })
      .eq('id', safeTransactionId)

    await supabase
      .from('orders')
      .update({
        delivery_status: 'completed',
        updated_at: toIsoTimestamp(new Date()),
      })
      .eq('transaction_id', safeTransactionId)

    const transaction = await getTransactionById(safeTransactionId)

    if (transaction) {
      await updateListingStatus(transaction.listing_id, 'closed')
      await logPlatformEvent({
        event_name: 'transaction_released',
        user_id: transaction.seller_id,
        entity_type: 'transaction',
        entity_id: transaction.id,
        metadata: {
          amount: transaction.amount,
          listing_id: transaction.listing_id,
        },
      })
      await updateTrustScore(transaction.buyer_id, 'TRANSACTION_SUCCESS', 5)
      await updateTrustScore(transaction.seller_id, 'TRANSACTION_SUCCESS', 5)
      await logEscrowEvent(transaction.id, 'ESCROW_RELEASED', { amount: transaction.amount, platform_fee: platformFee })
    }

    return transaction
  } catch (error) {
    console.error('[Transaction] Unexpected release error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}
