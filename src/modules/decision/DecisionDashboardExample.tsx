/**
 * Example Usage - Decision Engine Dashboard
 *
 * Shows how to use useDecision hook with components
 */

'use client'

import InsightFeed, { InsightFeedHeader } from '@/components/InsightFeed'
import RecommendationPanel, { RecommendationPanelHeader } from '@/components/RecommendationPanel'
import { useDecision } from '@/hooks/useDecision'
import type { Recommendation } from '@/modules/decision/decision.types'

interface DashboardProps {
  userId: string
}

/**
 * Example 1: Basic Dashboard
 */
export function DecisionDashboard({ userId }: DashboardProps) {
  const { insights, recommendations, loading, error, executionTime, summary, refetch } =
    useDecision(userId)

  const criticalRecommendations = recommendations.filter((recommendation) => recommendation.priority === 'critical')
  const highRecommendations = recommendations.filter((recommendation) => recommendation.priority === 'high')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Intelligence Dashboard</h1>
          <p className="text-gray-600">Real-time insights and recommendations for your farm</p>
          <button
            onClick={refetch}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Warning</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <InsightFeedHeader
              count={insights.length}
              summary={summary}
              executionTime={executionTime}
            />
            <InsightFeed insights={insights} loading={loading} error={error} />
          </div>

          <div>
            <RecommendationPanelHeader
              count={recommendations.length}
              criticalCount={criticalRecommendations.length}
              highCount={highRecommendations.length}
            />
            <RecommendationPanel
              recommendations={recommendations}
              loading={loading}
              error={error}
              onActionClick={handleRecommendationAction}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function handleRecommendationAction(recommendation: Recommendation) {
  console.log('User clicked action:', recommendation.suggestedAction)
  console.log('Recommendation:', recommendation)
}

interface CompactWidgetProps {
  userId: string
  maxItems?: number
}

export function DecisionWidget({ userId, maxItems = 3 }: CompactWidgetProps) {
  const { insights, recommendations, loading, error } = useDecision(userId)

  const topInsights = insights.slice(0, maxItems)
  const topRecommendations = recommendations.slice(0, maxItems)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-gray-900 mb-4">Quick Insights</h3>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {topInsights.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">INSIGHTS ({insights.length})</p>
              <div className="space-y-2">
                {topInsights.map((insight) => (
                  <div key={insight.id} className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {(insight.type || '').toUpperCase()} | {(insight.timestamp || '').slice(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topRecommendations.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                RECOMMENDATIONS ({recommendations.length})
              </p>
              <div className="space-y-2">
                {topRecommendations.map((rec) => (
                  <div key={rec.id} className="text-sm text-gray-700 p-2 bg-yellow-50 rounded">
                    <p className="font-medium">{rec.title}</p>
                    <span
                      className={`inline-block text-xs mt-1 px-2 py-1 rounded ${
                        rec.priority === 'critical'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function DecisionDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg shadow animate-pulse"></div>
              ))}
            </div>
          </div>

          <div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-white rounded-lg shadow animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
