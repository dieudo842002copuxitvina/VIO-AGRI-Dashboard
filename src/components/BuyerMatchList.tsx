'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Handshake, MapPin, ShieldCheck } from 'lucide-react'

import type { BuyerMatch } from '@/modules/match/match.types'

interface BuyerMatchListProps {
  listingId?: string | null
  listingTitle?: string | null
  onSelectBuyer?: (buyer: BuyerMatch) => void
  selectedBuyerId?: string | null
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

function normalizeBuyerMatch(raw: unknown): BuyerMatch {
  const record = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const rawReasons = Array.isArray(record.match_reasons)
    ? record.match_reasons.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      )
    : []

  return {
    buyer_id: toSafeText(record.buyer_id, 'unknown-buyer'),
    score: toSafeNumber(record.score, 0),
    match_reasons: rawReasons,
    buyer_role:
      record.buyer_role === 'trader' || record.buyer_role === 'exporter' ? record.buyer_role : 'unknown',
    buyer_region: toSafeText(record.buyer_region, 'Unknown region'),
    trust_score: toSafeNumber(record.trust_score, 0),
    verified: Boolean(record.verified),
    last_activity_at: toSafeText(record.last_activity_at, '') || null,
  }
}

export default function BuyerMatchList({
  listingId = null,
  listingTitle = null,
  onSelectBuyer,
  selectedBuyerId = null,
}: BuyerMatchListProps) {
  const [matches, setMatches] = useState<BuyerMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchMatches() {
      if (!listingId) {
        setMatches([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listing_id: listingId }),
        })

        if (!response.ok) {
          throw new Error(`Matching request failed with status ${response.status}`)
        }

        const json = (await response.json()) as { matches?: unknown[] }
        const safeMatches = Array.isArray(json?.matches) ? json.matches.map((item) => normalizeBuyerMatch(item)) : []

        if (isMounted) {
          setMatches(safeMatches)
        }
      } catch (fetchError) {
        if (isMounted) {
          setMatches([])
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load buyer matches.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchMatches()

    return () => {
      isMounted = false
    }
  }, [listingId])

  function handleSelectBuyer(buyer: BuyerMatch) {
    onSelectBuyer?.(buyer)
    document.getElementById('negotiation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Matching Engine</p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">Qualified buyers for this listing</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Trust-aware scoring prioritizes buyers with commodity fit, local reach, pricing alignment, activity, and verification.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <p className="font-semibold text-stone-900">Selected listing</p>
          <p className="mt-1 max-w-xs text-sm text-stone-600">{listingTitle || 'Choose a listing to generate buyer matches.'}</p>
        </div>
      </div>

      {!listingId ? (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
          Pick a listing from the marketplace board to see the strongest buyers and start negotiation.
        </div>
      ) : loading ? (
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="animate-pulse rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <div className="h-5 w-32 rounded bg-stone-200"></div>
              <div className="mt-3 h-4 w-full rounded bg-stone-200"></div>
              <div className="mt-4 h-10 w-40 rounded-full bg-stone-200"></div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
          {error || 'No buyers cleared the quality threshold yet. Try another listing or adjust pricing.'}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          )}

          {matches.map((buyer) => {
            const isSelected = selectedBuyerId === buyer.buyer_id

            return (
              <article
                key={buyer.buyer_id}
                className={`rounded-3xl border p-5 transition ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50/70 shadow-sm shadow-emerald-900/10'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        <Handshake className="h-4 w-4" />
                        Buyer score {buyer.score}
                      </span>
                      {buyer.verified && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                          <ShieldCheck className="h-4 w-4" />
                          Verified
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-stone-950">{buyer.buyer_role || 'Buyer'} {buyer.buyer_id.slice(0, 8)}</h3>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
                      <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1">
                        <MapPin className="h-4 w-4" />
                        {buyer.buyer_region || 'Unknown region'}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1">
                        <BadgeCheck className="h-4 w-4" />
                        Trust {buyer.trust_score ?? 0}/100
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(Array.isArray(buyer.match_reasons) ? buyer.match_reasons : []).map((reason) => (
                        <span
                          key={`${buyer.buyer_id}-${reason}`}
                          className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectBuyer(buyer)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                  >
                    {isSelected ? 'Buyer Selected' : 'Start Negotiation'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
