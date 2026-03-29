'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Cpu, Droplets, Leaf } from 'lucide-react'

import {
  FALLBACK_CROSS_SELL_PRODUCTS,
  normalizeCrossSellProduct,
  type CrossSellProductViewModel,
} from '@/lib/trade-ui'

interface CrossSellWidgetProps {
  userId?: string
}

const DEFAULT_USER_ID = 'user_003'

function getCategoryIcon(categoryLabel: string) {
  if (categoryLabel.toLowerCase().includes('iot')) {
    return <Cpu className="h-5 w-5" />
  }

  if (categoryLabel.toLowerCase().includes('irrigation')) {
    return <Droplets className="h-5 w-5" />
  }

  return <Leaf className="h-5 w-5" />
}

export default function CrossSellWidget({ userId = DEFAULT_USER_ID }: CrossSellWidgetProps) {
  const [products, setProducts] = useState<CrossSellProductViewModel[]>(FALLBACK_CROSS_SELL_PRODUCTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchCrossSellProducts() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/recommendation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            filter: {
              types: ['product'],
              maxResults: 3,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Recommendation request failed with status ${response.status}`)
        }

        const json = (await response.json()) as { recommendations?: unknown[] }
        const safeRecommendations = Array.isArray(json?.recommendations) ? json.recommendations : []
        const normalizedProducts = safeRecommendations
          .map((item) => normalizeCrossSellProduct(item))
          .filter((item): item is CrossSellProductViewModel => item !== null)
          .slice(0, 3)

        if (isMounted) {
          setProducts(
            normalizedProducts.length > 0 ? normalizedProducts : FALLBACK_CROSS_SELL_PRODUCTS
          )
        }
      } catch (err) {
        if (isMounted) {
          setProducts(FALLBACK_CROSS_SELL_PRODUCTS)
          setError(
            err instanceof Error ? err.message : 'Unable to load cross-sell recommendations.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchCrossSellProducts()

    return () => {
      isMounted = false
    }
  }, [userId])

  return (
    <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Cross Sell</p>
      <h2 className="mt-4 text-2xl font-semibold text-stone-950">Add products that support the trade</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Use recommendation data to surface tools and inputs that help users close better deals.
      </p>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-3xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="h-5 w-24 rounded bg-stone-200"></div>
              <div className="mt-3 h-6 w-2/3 rounded bg-stone-200"></div>
              <div className="mt-3 h-4 w-full rounded bg-stone-200"></div>
              <div className="mt-4 h-10 w-full rounded-full bg-stone-200"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-3xl border border-stone-200 bg-stone-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/60"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm shadow-stone-950/5">
                  {getCategoryIcon(product.categoryLabel)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    {product.categoryLabel}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-stone-950">{product.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{product.description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-stone-950">{product.priceLabel}</p>
                <Link
                  href={product.href}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  Explore Product
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 p-6 text-center">
          <p className="text-sm text-stone-600">No cross-sell products available right now.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            Browse Shop
          </Link>
        </div>
      )}
    </aside>
  )
}
