'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, TrendingUp } from 'lucide-react'

import { supabase } from '@/lib/supabase/client'

interface MarketOption {
  commodity: string
  price: number
  unit: string
  trend: 'up' | 'down' | 'stable'
}

const fallbackOptions: MarketOption[] = [
  { commodity: 'Coffee', price: 3300, unit: 'USD/mt', trend: 'up' },
  { commodity: 'Pepper', price: 98000, unit: 'VND/kg', trend: 'up' },
  { commodity: 'Rice', price: 14800, unit: 'VND/kg', trend: 'stable' },
]

function normalizeMarketOption(raw: unknown): MarketOption | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const commodity = typeof record.commodity === 'string' ? record.commodity.trim() : ''

  if (!commodity) {
    return null
  }

  const price = typeof record.price === 'number' ? record.price : Number(record.price)

  return {
    commodity,
    price: Number.isFinite(price) ? price : 0,
    unit: typeof record.unit === 'string' && record.unit.trim().length > 0 ? record.unit : 'unit',
    trend:
      record.trend === 'up' || record.trend === 'down' || record.trend === 'stable'
        ? record.trend
        : 'stable',
  }
}

function PostB2BPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const commodityParam = searchParams.get('commodity') || ''
  const intent = searchParams.get('intent') || ''

  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [marketOptions, setMarketOptions] = useState<MarketOption[]>(fallbackOptions)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    commodity: commodityParam || 'Coffee',
    quantity: '',
    price_per_unit: '',
    region: '',
    description: '',
  })

  useEffect(() => {
    let isMounted = true

    async function initPage() {
      try {
        const [sessionResponse, marketResponse] = await Promise.all([
          supabase.auth.getSession(),
          fetch('/api/market-data', { cache: 'no-store' }),
        ])

        const session = sessionResponse.data.session
        if (!session) {
          router.push('/login')
          return
        }

        const marketJson = marketResponse.ok
          ? ((await marketResponse.json()) as { market?: unknown[] })
          : { market: [] }
        const safeOptions = Array.isArray(marketJson?.market)
          ? marketJson.market.map((item) => normalizeMarketOption(item)).filter((item): item is MarketOption => item !== null)
          : []

        if (!isMounted) {
          return
        }

        setUserId(session.user.id)
        setMarketOptions(safeOptions.length > 0 ? safeOptions : fallbackOptions)

        const preferredCommodity = commodityParam || safeOptions[0]?.commodity || fallbackOptions[0].commodity
        const preferredOption = (safeOptions.length > 0 ? safeOptions : fallbackOptions).find(
          (item) => item.commodity.toLowerCase() === preferredCommodity.toLowerCase()
        )

        setFormData((current) => ({
          ...current,
          commodity: preferredCommodity,
          title: current.title || `${intent === 'sell' ? 'Sell' : 'List'} ${preferredCommodity} for verified buyers`,
          price_per_unit: current.price_per_unit || String(Math.round(preferredOption?.price || 0)),
        }))
      } catch (initError) {
        if (isMounted) {
          setError(initError instanceof Error ? initError.message : 'Unable to initialize listing form.')
        }
      } finally {
        if (isMounted) {
          setInitializing(false)
        }
      }
    }

    void initPage()

    return () => {
      isMounted = false
    }
  }, [commodityParam, intent, router])

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!userId) {
      setError('User session is required to create a listing.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller_id: userId,
          title: formData.title,
          commodity: formData.commodity,
          quantity: Number(formData.quantity),
          price_per_unit: Number(formData.price_per_unit),
          region: formData.region,
          description: formData.description,
        }),
      })

      const json = (await response.json()) as { listing?: { id?: string }; message?: string }

      if (!response.ok || !json?.listing?.id) {
        throw new Error(json?.message || `Listing creation failed with status ${response.status}`)
      }

      router.push(`/b2b?listing=${encodeURIComponent(json.listing.id)}&commodity=${encodeURIComponent(formData.commodity)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create listing.')
    } finally {
      setLoading(false)
    }
  }

  const selectedCommodity = marketOptions.find(
    (item) => item.commodity.toLowerCase() === formData.commodity.toLowerCase()
  ) || marketOptions[0] || fallbackOptions[0]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f5f5f4_45%,#ffffff_100%)] text-stone-950">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Create Listing</p>
              <h1 className="mt-3 text-3xl font-semibold text-stone-950">Launch inventory into the trade funnel</h1>
            </div>
            <Link href="/b2b" className="text-sm font-semibold text-stone-600 transition hover:text-stone-950">
              Back to marketplace
            </Link>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Listing title</span>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Sell 20 tons of export-grade coffee"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Commodity</span>
                <select
                  name="commodity"
                  value={formData.commodity}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                >
                  {marketOptions.map((option) => (
                    <option key={option.commodity} value={option.commodity}>
                      {option.commodity}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Region</span>
                <input
                  required
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Central Highlands"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Quantity</span>
                <input
                  required
                  min="0"
                  step="any"
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="20"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Price per unit</span>
                <input
                  required
                  min="0"
                  step="any"
                  type="number"
                  name="price_per_unit"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  placeholder="3300"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Add quality specs, delivery timing, packaging, and contract preferences"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={loading || initializing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating listing...' : 'Create listing and find buyers'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>

        <aside className="rounded-[2rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(180deg,#ffffff_0%,#f7f7f5_100%)] p-6 shadow-sm shadow-stone-950/5 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Market guidance</p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">Price with current demand, not guesswork</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Use the latest market intelligence to create a listing buyers will engage with immediately.
          </p>

          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Suggested anchor</p>
            <p className="mt-3 text-3xl font-semibold text-stone-950">{Math.round(selectedCommodity?.price || 0)} {selectedCommodity?.unit || 'unit'}</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <TrendingUp className="h-4 w-4" />
              Trend {selectedCommodity?.trend || 'stable'} for {selectedCommodity?.commodity || 'this commodity'}
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-5">
            <p className="text-sm font-semibold text-stone-900">Conversion checklist</p>
            <div className="mt-4 space-y-3 text-sm text-stone-600">
              <p>1. Use a clear commodity title with quantity and quality hints.</p>
              <p>2. Price close to live market momentum to unlock buyer matches.</p>
              <p>3. Add delivery details so negotiation can move straight into escrow.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

function PostB2BPageFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f5f5f4_45%,#ffffff_100%)] text-stone-950">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-stone-500 sm:px-6 lg:px-8">
        Preparing the listing composer...
      </div>
    </main>
  )
}

export default function PostB2BPage() {
  return (
    <Suspense fallback={<PostB2BPageFallback />}>
      <PostB2BPageContent />
    </Suspense>
  )
}

