'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Search, SquarePen } from 'lucide-react'

import { useExperiment } from '@/hooks/useExperiment'
import { buildTradeActionViewModel, formatConfidence } from '@/lib/trade-ui'
import type { Insight } from '@/modules/decision/decision.contract'
import type { Recommendation } from '@/modules/decision/decision.types'

interface TradeActionCardProps {
  insight?: Insight | null
  recommendation?: Recommendation | null
  loading?: boolean
}

export default function TradeActionCard({
  insight = null,
  recommendation = null,
  loading = false,
}: TradeActionCardProps) {
  const router = useRouter()
  const { assignment, track } = useExperiment('cta_button_test')

  if (loading) {
    return (
      <div className="animate-pulse rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
        <div className="h-6 w-32 rounded-full bg-stone-200"></div>
        <div className="mt-4 h-10 w-3/4 rounded bg-stone-200"></div>
        <div className="mt-3 h-4 w-full rounded bg-stone-200"></div>
        <div className="mt-6 grid gap-3">
          <div className="h-12 rounded-full bg-stone-200"></div>
          <div className="h-12 rounded-full bg-stone-200"></div>
          <div className="h-12 rounded-full bg-stone-200"></div>
        </div>
      </div>
    )
  }

  const actionView = buildTradeActionViewModel(insight, recommendation)
  const commodityQuery = encodeURIComponent(actionView.commodity.toLowerCase())

  function handlePrimaryClick() {
    if (assignment.variant === 'C') {
      void track('click_contact_buyer', {
        metadata: {
          source: 'trade_action_card',
          commodity: actionView.commodity,
          cta_label: assignment.label,
        },
      })
      router.push(`/b2b?intent=find-buyers&commodity=${commodityQuery}&experiment=${assignment.variant}`)
      return
    }

    void track('click_sell', {
      metadata: {
        source: 'trade_action_card',
        commodity: actionView.commodity,
        cta_label: assignment.label,
      },
    })

    const optimizePriceQuery = assignment.variant === 'B' ? '&mode=best-price' : ''
    router.push(
      `/b2b/post?intent=sell&commodity=${commodityQuery}&experiment=${assignment.variant}${optimizePriceQuery}`
    )
  }

  function handleFindBuyersClick() {
    void track('click_contact_buyer', {
      metadata: {
        source: 'trade_action_card',
        commodity: actionView.commodity,
        cta_label: 'Find Buyers',
      },
    })
    router.push(`/b2b?intent=find-buyers&commodity=${commodityQuery}`)
  }

  function handlePostListingClick() {
    void track('click_post_listing', {
      metadata: {
        source: 'trade_action_card',
        commodity: actionView.commodity,
        cta_label: 'Post Listing',
      },
    })
    router.push(`/b2b/post?commodity=${commodityQuery}&source=trade-card`)
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(180deg,#ffffff_0%,#f7f7f5_100%)] p-6 shadow-sm shadow-stone-950/5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Trade Action Card</p>
      <h2 className="mt-4 text-3xl font-semibold text-stone-950">{actionView.headline}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{actionView.reason}</p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
        <span className="rounded-full border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-900">
          Commodity: {actionView.commodity}
        </span>
        <span className="rounded-full border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-900">
          Confidence: {formatConfidence(actionView.confidence)}
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">
          Variant {assignment.variant}
        </span>
      </div>

      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {assignment.label}
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleFindBuyersClick}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-4 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
        >
          FIND BUYERS
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handlePostListingClick}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          POST LISTING
          <SquarePen className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
