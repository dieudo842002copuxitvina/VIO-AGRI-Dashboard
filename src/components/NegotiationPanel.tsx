'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Banknote, PackageCheck, ShieldCheck, Truck } from 'lucide-react'

import type { Listing } from '@/modules/listings/listings.types'
import type { BuyerMatch } from '@/modules/match/match.types'
import type { NegotiationRecord } from '@/modules/negotiation/negotiation.types'
import type { DeliveryStatus, TransactionRecord } from '@/modules/transaction/transaction.types'

interface NegotiationPanelProps {
  listing?: Listing | null
  buyer?: BuyerMatch | null
}

function toSafeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.trim())

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return fallback
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('en-US').format(Math.round(value || 0))}`
}

function normalizeNegotiation(raw: unknown): NegotiationRecord {
  const record = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

  return {
    id: toSafeText(record.id, `neg-${Date.now()}`),
    listing_id: toSafeText(record.listing_id, ''),
    buyer_id: toSafeText(record.buyer_id, ''),
    seller_id: toSafeText(record.seller_id, ''),
    offered_price: toSafeNumber(record.offered_price, 0),
    status:
      record.status === 'accepted' || record.status === 'rejected'
        ? record.status
        : 'pending',
    note: toSafeText(record.note, ''),
    commodity: toSafeText(record.commodity, 'Market commodity'),
    region: toSafeText(record.region, 'Unknown region'),
    listing_title: toSafeText(record.listing_title, 'Listing negotiation'),
    created_at: toSafeText(record.created_at, '') || null,
    updated_at: toSafeText(record.updated_at, '') || null,
  }
}

function normalizeTransaction(raw: unknown): TransactionRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>

  return {
    id: toSafeText(record.id, `txn-${Date.now()}`),
    negotiation_id: toSafeText(record.negotiation_id, ''),
    listing_id: toSafeText(record.listing_id, ''),
    buyer_id: toSafeText(record.buyer_id, ''),
    seller_id: toSafeText(record.seller_id, ''),
    amount: toSafeNumber(record.amount, 0),
    status:
      record.status === 'escrow' || record.status === 'released'
        ? record.status
        : 'pending',
    delivery_status:
      record.delivery_status === 'in_transit' ||
      record.delivery_status === 'delivered' ||
      record.delivery_status === 'completed'
        ? record.delivery_status
        : 'awaiting_dispatch',
    logistics_info: toSafeText(record.logistics_info, ''),
    created_at: toSafeText(record.created_at, '') || null,
    updated_at: toSafeText(record.updated_at, '') || null,
  }
}

export default function NegotiationPanel({ listing = null, buyer = null }: NegotiationPanelProps) {
  const [negotiations, setNegotiations] = useState<NegotiationRecord[]>([])
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOfferPrice(listing ? String(Math.round(listing.price_per_unit || 0)) : '')
  }, [listing?.id, listing?.price_per_unit])

  useEffect(() => {
    let isMounted = true

    async function fetchNegotiations() {
      if (!listing?.id) {
        setNegotiations([])
        setTransaction(null)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/negotiation?listing_id=${encodeURIComponent(listing.id)}`)

        if (!response.ok) {
          throw new Error(`Negotiation request failed with status ${response.status}`)
        }

        const json = (await response.json()) as { negotiations?: unknown[] }
        const safeNegotiations = Array.isArray(json?.negotiations)
          ? json.negotiations.map((item) => normalizeNegotiation(item))
          : []

        if (isMounted) {
          setNegotiations(safeNegotiations)
        }
      } catch (fetchError) {
        if (isMounted) {
          setNegotiations([])
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load negotiations.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchNegotiations()

    return () => {
      isMounted = false
    }
  }, [listing?.id])

  const activeNegotiation = buyer
    ? negotiations.find((item) => item.buyer_id === buyer.buyer_id) || null
    : negotiations[0] || null

  useEffect(() => {
    let isMounted = true

    async function fetchTransaction() {
      if (!activeNegotiation?.id) {
        setTransaction(null)
        return
      }

      try {
        const response = await fetch(
          `/api/transaction?negotiation_id=${encodeURIComponent(activeNegotiation.id)}`
        )

        if (!response.ok) {
          throw new Error(`Transaction request failed with status ${response.status}`)
        }

        const json = (await response.json()) as { transaction?: unknown }

        if (isMounted) {
          setTransaction(normalizeTransaction(json?.transaction))
        }
      } catch {
        if (isMounted) {
          setTransaction(null)
        }
      }
    }

    void fetchTransaction()

    return () => {
      isMounted = false
    }
  }, [activeNegotiation?.id])

  async function handleCreateNegotiation() {
    if (!listing?.id || !buyer?.buyer_id) {
      setError('Select a listing and buyer before creating a negotiation.')
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/negotiation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_id: buyer.buyer_id,
          seller_id: listing.seller_id,
          offered_price: Number(offerPrice || listing.price_per_unit || 0),
          note,
        }),
      })

      const json = (await response.json()) as { negotiation?: unknown; message?: string }

      if (!response.ok || !json?.negotiation) {
        throw new Error(json?.message || `Negotiation creation failed with status ${response.status}`)
      }

      const createdNegotiation = normalizeNegotiation(json.negotiation)
      setNegotiations((current) => [createdNegotiation, ...current.filter((item) => item.id !== createdNegotiation.id)])
      setNote('')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to create negotiation.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRespond(status: 'accepted' | 'rejected') {
    if (!activeNegotiation?.id) {
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          negotiation_id: activeNegotiation.id,
          status,
          note,
        }),
      })

      const json = (await response.json()) as { negotiation?: unknown; message?: string }

      if (!response.ok || !json?.negotiation) {
        throw new Error(json?.message || `Negotiation update failed with status ${response.status}`)
      }

      const updatedNegotiation = normalizeNegotiation(json.negotiation)
      setNegotiations((current) =>
        current.map((item) => (item.id === updatedNegotiation.id ? updatedNegotiation : item))
      )
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update negotiation.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleTransactionAction(
    action: 'create' | 'release' | 'fulfill',
    deliveryStatus?: DeliveryStatus
  ) {
    if (!activeNegotiation?.id) {
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const payload =
        action === 'create'
          ? { action, negotiation_id: activeNegotiation.id, amount: activeNegotiation.offered_price }
          : action === 'release'
            ? { action, transaction_id: transaction?.id }
            : {
                action,
                transaction_id: transaction?.id,
                delivery_status: deliveryStatus,
                logistics_info: deliveryStatus === 'delivered' ? 'Delivery confirmed by seller' : 'Shipment in progress',
              }

      const response = await fetch('/api/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const json = (await response.json()) as { transaction?: unknown; message?: string }

      if (!response.ok || !json?.transaction) {
        throw new Error(json?.message || `Transaction action failed with status ${response.status}`)
      }

      setTransaction(normalizeTransaction(json.transaction))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update transaction flow.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <section id="negotiation-panel" className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Negotiation and Escrow</p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">Close the trade without leaving the workflow</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Move from matched buyer to price agreement, escrow funding, delivery, and payout release in one place.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <p className="font-semibold text-stone-900">Trade context</p>
          <p className="mt-1 max-w-xs text-sm text-stone-600">{listing?.title || 'Choose a listing first, then select a buyer match.'}</p>
        </div>
      </div>

      {!listing ? (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
          Select a listing to unlock negotiation and payment actions.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Offer setup</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Offer price</span>
                  <input
                    type="number"
                    min="0"
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Buyer selected</span>
                  <div className="mt-2 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-600">
                    {buyer?.buyer_id || 'No buyer selected yet'}
                  </div>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-stone-700">Negotiation note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                  placeholder="Add delivery terms, payment window, or quality notes"
                />
              </label>

              <button
                type="button"
                onClick={handleCreateNegotiation}
                disabled={actionLoading || !buyer}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Negotiation
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Active negotiation</p>
              {loading ? (
                <div className="mt-4 animate-pulse space-y-3">
                  <div className="h-5 w-32 rounded bg-stone-200"></div>
                  <div className="h-4 w-full rounded bg-stone-200"></div>
                  <div className="h-10 w-full rounded-full bg-stone-200"></div>
                </div>
              ) : activeNegotiation ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-stone-950">{activeNegotiation.listing_title}</p>
                    <p className="mt-1 text-sm text-stone-600">Buyer {activeNegotiation.buyer_id.slice(0, 8)} offered {formatMoney(activeNegotiation.offered_price)} per unit.</p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 font-semibold text-stone-700">
                      Status: {activeNegotiation.status}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 font-semibold text-stone-700">
                      {activeNegotiation.commodity}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 font-semibold text-stone-700">
                      {activeNegotiation.region}
                    </span>
                  </div>

                  {activeNegotiation.note && (
                    <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                      {activeNegotiation.note}
                    </p>
                  )}

                  {activeNegotiation.status === 'pending' && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleRespond('accepted')}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Accept Offer
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond('rejected')}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject Offer
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-5 text-sm text-stone-600">
                  No negotiation thread yet. Pick a buyer and send the first offer.
                </div>
              )}
            </div>
          </div>

          {activeNegotiation?.status === 'accepted' && (
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Escrow and fulfillment</p>
                  <h3 className="mt-2 text-xl font-semibold text-stone-950">Execute payment and delivery milestones</h3>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                  <p className="font-semibold text-stone-900">Transaction</p>
                  <p className="mt-1 text-sm text-stone-600">{transaction ? `${transaction.status} | ${transaction.delivery_status}` : 'Escrow not funded yet'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => handleTransactionAction('create')}
                  disabled={actionLoading || Boolean(transaction)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fund Escrow
                  <Banknote className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTransactionAction('fulfill', 'in_transit')}
                  disabled={actionLoading || !transaction}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark In Transit
                  <Truck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTransactionAction('fulfill', 'delivered')}
                  disabled={actionLoading || !transaction}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark Delivered
                  <PackageCheck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTransactionAction('release')}
                  disabled={actionLoading || !transaction}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Release Funds
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {transaction && (
                <div className="mt-5 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
                  <p className="font-semibold text-stone-900">Escrow amount</p>
                  <p className="mt-1 text-lg font-bold text-stone-950">{formatMoney(transaction.amount)}</p>
                  <p className="mt-2">Delivery status: {transaction.delivery_status}</p>
                  <p className="mt-1">Logistics: {transaction.logistics_info || 'No logistics note yet'}</p>
                </div>
              )}
            </div>
          )}

          {!loading && negotiations.length > 0 && (
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Negotiation history</p>
              <div className="mt-4 space-y-3">
                {negotiations.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="font-semibold text-stone-900">Buyer {item.buyer_id.slice(0, 8)}</p>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2">Offer: {formatMoney(item.offered_price)} per unit</p>
                    {item.note && <p className="mt-1">Note: {item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
