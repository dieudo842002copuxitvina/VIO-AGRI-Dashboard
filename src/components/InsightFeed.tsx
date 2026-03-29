'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, Info, TrendingUp } from 'lucide-react'

import type { Insight } from '@/modules/decision/decision.contract'
import {
  formatConfidence,
  normalizeInsightCard,
  type InsightCardViewModel,
} from '@/lib/trade-ui'

interface InsightFeedProps {
  insights?: Insight[] | null
  loading?: boolean
  error?: string | null
}

interface InsightFeedHeaderProps {
  count: number
  summary?: string | null
  executionTime?: number | null
}

function getToneClasses(type: InsightCardViewModel['type']): string {
  switch (type) {
    case 'opportunity':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'risk':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-sky-200 bg-sky-50 text-sky-700'
  }
}

function getToneIcon(type: InsightCardViewModel['type']) {
  switch (type) {
    case 'opportunity':
      return <TrendingUp className="h-5 w-5" />
    case 'risk':
      return <AlertTriangle className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}

function InsightCard({ insight }: { insight: InsightCardViewModel }) {
  const router = useRouter()
  const commodityQuery = encodeURIComponent(insight.commodity.toLowerCase())
  const titlePreview = (insight.title || '').slice(0, 72)
  const needsEllipsis = insight.title.length > 72

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getToneClasses(insight.type)}`}
          >
            {getToneIcon(insight.type)}
            <span>{insight.type}</span>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-stone-900">
              {titlePreview}
              {needsEllipsis ? '...' : ''}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{insight.nextStep}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <p className="font-semibold text-stone-900">Confidence</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{formatConfidence(insight.confidence)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">{insight.commodity}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push(`/b2b/post?commodity=${commodityQuery}&source=insight`)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Take Action
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push(`/b2b?commodity=${commodityQuery}&source=insight`)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
        >
          View Opportunity
        </button>
      </div>
    </article>
  )
}

export function InsightFeedHeader({
  count,
  summary = null,
  executionTime = null,
}: InsightFeedHeaderProps) {
  const safeCount = Number.isFinite(count) ? count : 0
  const safeSummary = (summary || '').trim()
  const safeExecutionTime =
    typeof executionTime === 'number' && Number.isFinite(executionTime) ? executionTime : null

  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
          Insight to Action
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-950">Market signals worth acting on</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Every signal below is normalized before render and paired with a clear next step.
        </p>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm shadow-stone-950/5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Live Feed</p>
        <p className="mt-2 text-2xl font-semibold text-stone-950">{safeCount}</p>
        <p className="text-sm text-stone-500">active insights</p>
        {safeSummary && <p className="mt-3 max-w-xs text-sm text-stone-600">{safeSummary}</p>}
        {safeExecutionTime !== null && (
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-400">
            {safeExecutionTime}ms pipeline
          </p>
        )}
      </div>
    </div>
  )
}

export default function InsightFeed({ insights, loading = false, error = null }: InsightFeedProps) {
  const router = useRouter()
  const safeInsights = Array.isArray(insights) ? insights : []
  const normalizedInsights = safeInsights.map((item) => normalizeInsightCard(item))

  if (loading) {
    return (
      <div className="grid gap-4">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5"
          >
            <div className="h-6 w-32 rounded-full bg-stone-200"></div>
            <div className="mt-4 h-7 w-2/3 rounded bg-stone-200"></div>
            <div className="mt-3 h-4 w-full rounded bg-stone-200"></div>
            <div className="mt-6 flex gap-3">
              <div className="h-11 w-36 rounded-full bg-stone-200"></div>
              <div className="h-11 w-36 rounded-full bg-stone-200"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (normalizedInsights.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm shadow-stone-950/5">
        <p className="text-lg font-semibold text-stone-900">No live insights yet</p>
        <p className="mt-2 text-sm text-stone-600">
          {error || 'We will surface market signals here as soon as fresh data arrives.'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/b2b/post')}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          Post Listing Instead
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {normalizedInsights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  )
}
