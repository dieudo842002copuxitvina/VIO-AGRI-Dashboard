'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Search, ShieldAlert, SquarePen } from 'lucide-react'

import {
  formatConfidence,
  normalizeDecisionRecommendation,
  type RecommendationCardViewModel,
} from '@/lib/trade-ui'
import type { Recommendation } from '@/modules/decision/decision.types'

interface RecommendationPanelProps {
  recommendations?: Recommendation[] | null
  loading?: boolean
  error?: string | null
  onActionClick?: (recommendation: Recommendation) => void
}

interface RecommendationPanelHeaderProps {
  count: number
  criticalCount?: number
  highCount?: number
  summary?: string | null
}

const priorityOrder: Record<RecommendationCardViewModel['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function getActionClasses(action: RecommendationCardViewModel['action']): string {
  switch (action) {
    case 'SELL':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'BUY':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

function getPriorityClasses(priority: RecommendationCardViewModel['priority']): string {
  switch (priority) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-200'
    case 'high':
      return 'text-orange-700 bg-orange-50 border-orange-200'
    case 'low':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    default:
      return 'text-stone-700 bg-stone-50 border-stone-200'
  }
}

function RecommendationCard({
  recommendation,
  viewModel,
  onActionClick,
}: {
  recommendation: Recommendation
  viewModel: RecommendationCardViewModel
  onActionClick?: (recommendation: Recommendation) => void
}) {
  const router = useRouter()
  const commodityQuery = encodeURIComponent(viewModel.commodity.toLowerCase())

  function handleSellNow() {
    onActionClick?.(recommendation)
    router.push(`/b2b/post?intent=sell&commodity=${commodityQuery}`)
  }

  function handleFindBuyers() {
    onActionClick?.(recommendation)
    router.push(`/b2b?intent=find-buyers&commodity=${commodityQuery}`)
  }

  function handlePostListing() {
    onActionClick?.(recommendation)
    router.push(`/b2b/post?commodity=${commodityQuery}`)
  }

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getActionClasses(viewModel.action)}`}
            >
              {viewModel.action}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getPriorityClasses(viewModel.priority)}`}
            >
              {viewModel.priority}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              {viewModel.commodity}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-stone-950">{viewModel.title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{viewModel.reason}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <p className="font-semibold text-stone-900">Confidence</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{formatConfidence(viewModel.confidence)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">Action cue</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <button
          type="button"
          onClick={handleSellNow}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          SELL NOW
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleFindBuyers}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
        >
          FIND BUYERS
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handlePostListing}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          POST LISTING
          <SquarePen className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}

export function RecommendationPanelHeader({
  count,
  criticalCount = 0,
  highCount = 0,
  summary,
}: RecommendationPanelHeaderProps) {
  const safeCount = Number.isFinite(count) ? count : 0

  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          Recommendation to Action
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-stone-950">What should the user do next?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Recommendations are translated into direct trading actions so the user can move immediately.
        </p>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm shadow-stone-950/5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Live Actions</p>
        <p className="mt-2 text-2xl font-semibold text-stone-950">{safeCount}</p>
        <p className="text-sm text-stone-500">actionable recommendations</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
            {criticalCount} critical
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
            {highCount} high
          </span>
        </div>
        {summary && <p className="mt-3 max-w-xs text-sm text-stone-600">{summary}</p>}
      </div>
    </div>
  )
}

export default function RecommendationPanel({
  recommendations,
  loading = false,
  error = null,
  onActionClick,
}: RecommendationPanelProps) {
  const router = useRouter()
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : []
  const normalizedRecommendations = safeRecommendations
    .map((recommendation) => ({
      raw: recommendation,
      viewModel: normalizeDecisionRecommendation(recommendation),
    }))
    .sort((left, right) => priorityOrder[left.viewModel.priority] - priorityOrder[right.viewModel.priority])

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
            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              <div className="h-11 rounded-full bg-stone-200"></div>
              <div className="h-11 rounded-full bg-stone-200"></div>
              <div className="h-11 rounded-full bg-stone-200"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (normalizedRecommendations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm shadow-stone-950/5">
        <ShieldAlert className="mx-auto h-10 w-10 text-stone-300" />
        <p className="mt-4 text-lg font-semibold text-stone-900">No action recommendations yet</p>
        <p className="mt-2 text-sm text-stone-600">
          The next trade signal will appear here once our engines score enough market confidence.
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

      {normalizedRecommendations.map(({ raw, viewModel }) => (
        <RecommendationCard
          key={viewModel.id}
          recommendation={raw}
          viewModel={viewModel}
          onActionClick={onActionClick}
        />
      ))}
    </div>
  )
}
