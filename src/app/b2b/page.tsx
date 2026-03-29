'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MapPin, Package2, Search, ShieldCheck } from 'lucide-react'

import BuyerMatchList from '@/components/BuyerMatchList'
import NegotiationPanel from '@/components/NegotiationPanel'
import type { Listing } from '@/modules/listings/listings.types'
import type { BuyerMatch } from '@/modules/match/match.types'

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

function normalizeListing(raw: unknown): Listing | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>

  return {
    id: toSafeText(record.id, `listing-${Date.now()}`),
    seller_id: toSafeText(record.seller_id, toSafeText(record.user_id, 'unknown-seller')),
    user_id: toSafeText(record.user_id, toSafeText(record.seller_id, 'unknown-seller')),
    title: toSafeText(record.title, 'Untitled listing'),
    commodity: toSafeText(record.commodity, 'Market commodity'),
    commodity_id: toSafeText(record.commodity_id, '') || null,
    quantity: toSafeNumber(record.quantity, 0),
    price_per_unit: toSafeNumber(record.price_per_unit, 0),
    region: toSafeText(record.region, 'Unknown region'),
    description: toSafeText(record.description, ''),
    status:
      record.status === 'matched' || record.status === 'closed'
        ? record.status
        : 'active',
    unit: toSafeText(record.unit, 'unit'),
    created_at: toSafeText(record.created_at, '') || null,
    updated_at: toSafeText(record.updated_at, '') || null,
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value || 0))
}

function B2BMarketplaceContent() {
  const searchParams = useSearchParams()
  const commodityFilter = searchParams.get('commodity') || ''
  const regionFilter = searchParams.get('region') || ''
  const selectedListingId = searchParams.get('listing') || ''
  const currentIntent = searchParams.get('intent') || ''

  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchListings() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (commodityFilter) {
          params.set('commodity', commodityFilter)
        }
        if (regionFilter) {
          params.set('region', regionFilter)
        }
        params.set('limit', '24')

        const response = await fetch(`/api/listings?${params.toString()}`, { cache: 'no-store' })

        if (!response.ok) {
          throw new Error(`Listings request failed with status ${response.status}`)
        }

        const json = (await response.json()) as { listings?: unknown[] }
        const safeListings = Array.isArray(json?.listings)
          ? json.listings.map((item) => normalizeListing(item)).filter((item): item is Listing => item !== null)
          : []

        if (!isMounted) {
          return
        }

        setListings(safeListings)

        const nextSelectedListing =
          safeListings.find((item) => item.id === selectedListingId) ||
          safeListings.find((item) => item.id === selectedListing?.id) ||
          safeListings[0] ||
          null

        setSelectedListing(nextSelectedListing)
      } catch (fetchError) {
        if (isMounted) {
          setListings([])
          setSelectedListing(null)
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load marketplace listings.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchListings()

    return () => {
      isMounted = false
    }
  }, [commodityFilter, regionFilter, selectedListingId])

  useEffect(() => {
    setSelectedBuyer(null)
  }, [selectedListing?.id])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f5f5f4_45%,#ffffff_100%)] text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[2.5rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7f5_100%)] p-6 shadow-sm shadow-stone-950/5 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-700">Trade Console</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-stone-950 lg:text-5xl">
                From listing to escrow release in one operational flow.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-600">
                VIO AGRI now turns each listing into a conversion workflow: view qualified buyers, negotiate pricing, fund escrow, confirm delivery, and release payout.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/b2b/post"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Post Listing
                </Link>
                <Link
                  href="/b2b/my-listings"
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-white"
                >
                  Manage Listings
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Active listings</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{listings.length}</p>
                <p className="mt-1 text-sm text-stone-600">inventory ready for matching</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Selected commodity</p>
                <p className="mt-3 text-2xl font-semibold text-stone-950">{selectedListing?.commodity || commodityFilter || 'All'}</p>
                <p className="mt-1 text-sm text-stone-600">market filter in play</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Pipeline</p>
                <p className="mt-3 text-2xl font-semibold text-stone-950">Match to Negotiate to Pay</p>
                <p className="mt-1 text-sm text-stone-600">execution path for B2B trades</p>
              </div>
            </div>
          </div>

          {currentIntent === 'find-buyers' && (
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
              Buyer discovery mode is active. Select a listing below to see the strongest buyer matches and open a negotiation.
            </div>
          )}
        </section>

        {error && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {error}
          </div>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Marketplace</p>
                  <h2 className="mt-3 text-2xl font-semibold text-stone-950">Live listings ready for buyer acquisition</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Every card below is built to push the user into a buyer-match and negotiation action.
                  </p>
                </div>

                <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  <p className="font-semibold text-stone-900">Filters</p>
                  <p className="mt-1">Commodity: {commodityFilter || 'All'}</p>
                  <p className="mt-1">Region: {regionFilter || 'All'}</p>
                </div>
              </div>

              {loading ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="animate-pulse rounded-3xl border border-stone-200 bg-stone-50 p-5">
                      <div className="h-5 w-32 rounded bg-stone-200"></div>
                      <div className="mt-3 h-4 w-full rounded bg-stone-200"></div>
                      <div className="mt-4 h-10 w-40 rounded-full bg-stone-200"></div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                  <p className="text-lg font-semibold text-stone-900">No listings available yet</p>
                  <p className="mt-2 text-sm text-stone-600">Create the first listing to start buyer discovery and monetizable trade flow.</p>
                  <Link
                    href="/b2b/post"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                  >
                    Create Listing
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {listings.map((item) => {
                    const isSelected = selectedListing?.id === item.id

                    return (
                      <article
                        key={item.id}
                        className={`rounded-3xl border p-5 transition ${
                          isSelected
                            ? 'border-emerald-300 bg-emerald-50/70 shadow-sm shadow-emerald-900/10'
                            : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{item.commodity}</p>
                            <h3 className="mt-2 text-xl font-semibold text-stone-950">{item.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-stone-600">{item.description || 'No additional listing description provided.'}</p>
                          </div>
                          {item.status === 'matched' && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                              <ShieldCheck className="h-4 w-4" />
                              Matched
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-600">
                          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1">
                            <Package2 className="h-4 w-4" />
                            {item.quantity} {item.unit}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1">
                            <MapPin className="h-4 w-4" />
                            {item.region}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Ask price</p>
                            <p className="mt-1 text-2xl font-semibold text-stone-950">{formatMoney(item.price_per_unit)}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedListing(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                          >
                            {isSelected ? 'Viewing Buyers' : 'View Buyers'}
                            <Search className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <BuyerMatchList
              listingId={selectedListing?.id}
              listingTitle={selectedListing?.title}
              selectedBuyerId={selectedBuyer?.buyer_id || null}
              onSelectBuyer={setSelectedBuyer}
            />
            <NegotiationPanel listing={selectedListing} buyer={selectedBuyer} />
          </div>
        </section>
      </div>
    </main>
  )
}


function B2BMarketplaceFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f5f5f4_45%,#ffffff_100%)] text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-stone-500 sm:px-6 lg:px-8">
        Preparing the B2B trade console...
      </div>
    </main>
  )
}

export default function B2BMarketplace() {
  return (
    <Suspense fallback={<B2BMarketplaceFallback />}>
      <B2BMarketplaceContent />
    </Suspense>
  )
}

