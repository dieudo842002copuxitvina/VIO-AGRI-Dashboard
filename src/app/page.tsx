'use client'

import Link from 'next/link'

import CrossSellWidget from '@/components/CrossSellWidget'
import InsightFeed, { InsightFeedHeader } from '@/components/InsightFeed'
import PriceChart from '@/components/PriceChart'
import RecommendationPanel, { RecommendationPanelHeader } from '@/components/RecommendationPanel'
import TradeActionCard from '@/components/TradeActionCard'
import { useDecision } from '@/hooks/useDecision'

export default function Page() {
  const { insights, recommendations, summary, executionTime, loading, error } = useDecision()
  const safeInsights = Array.isArray(insights) ? insights : []
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : []
  const criticalCount = safeRecommendations.filter((item) => item.priority === 'critical').length
  const highCount = safeRecommendations.filter((item) => item.priority === 'high').length
  const topInsight = safeInsights[0] ?? null
  const topRecommendation = safeRecommendations[0] ?? null

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f5f5f4_45%,#ffffff_100%)] text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[2.5rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7f5_100%)] p-6 shadow-sm shadow-stone-950/5 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-700">
                Data to Transaction
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-stone-950 lg:text-6xl">
                Turn live agri-market signals into listings, buyer outreach, and closed trades.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-600">
                VIO AGRI is designed as a conversion funnel, not a passive dashboard. Each section
                below moves the user from market data to insight, from insight to recommendation,
                and from recommendation to action.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/b2b/post"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Post Listing
                </Link>
                <Link
                  href="/b2b"
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-white"
                >
                  Find Buyers
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Insights</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{safeInsights.length}</p>
                <p className="mt-1 text-sm text-stone-600">signals waiting for action</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Recommendations</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{safeRecommendations.length}</p>
                <p className="mt-1 text-sm text-stone-600">trade prompts ready to use</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Pipeline</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{executionTime}ms</p>
                <p className="mt-1 text-sm text-stone-600">decision processing window</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <span className="font-semibold">Current market summary:</span> {summary || 'Waiting for the latest market intelligence feed.'}
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Decision API fallback mode is active. The page still renders safe empty states and CTA flows.
            Detail: {error}
          </div>
        )}

        <section className="mt-8">
          <PriceChart />
        </section>

        <section className="mt-8">
          <InsightFeedHeader
            count={safeInsights.length}
            summary={summary}
            executionTime={executionTime}
          />
          <InsightFeed insights={safeInsights} loading={loading} error={error} />
        </section>

        <section className="mt-8">
          <RecommendationPanelHeader
            count={safeRecommendations.length}
            criticalCount={criticalCount}
            highCount={highCount}
            summary={summary}
          />
          <RecommendationPanel
            recommendations={safeRecommendations}
            loading={loading}
            error={error}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <TradeActionCard
            insight={topInsight}
            recommendation={topRecommendation}
            loading={loading}
          />
          <CrossSellWidget />
        </section>
      </div>
    </main>
  )
}
