/**
 * InsightFeed Component
 * 
 * Displays market insights in a clean, readable format
 * Pure presentation - no business logic
 * 
 * Props: { insights: Insight[], loading: boolean, error: string | null }
 */

'use client'

import type { Insight } from '@/decision.types'
import { AlertCircle, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

interface InsightFeedProps {
  insights: Insight[]
  loading?: boolean
  error?: string | null
}

/**
 * Get icon based on insight category
 */
function getCategoryIcon(category: string): React.ReactNode {
  switch (category) {
    case 'trend':
      return <TrendingUp className="w-5 h-5 text-blue-500" />
    case 'risk':
      return <AlertTriangle className="w-5 h-5 text-orange-500" />
    case 'opportunity':
      return <Lightbulb className="w-5 h-5 text-yellow-500" />
    case 'market':
    default:
      return <AlertCircle className="w-5 h-5 text-gray-500" />
  }
}

/**
 * Get badge color based on confidence
 */
function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 0.9) return 'bg-green-100 text-green-800'
  if (confidence >= 0.7) return 'bg-blue-100 text-blue-800'
  if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

/**
 * Format confidence as percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

/**
 * InsightFeed Component
 */
export function InsightFeed({ insights, loading = false, error = null }: InsightFeedProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Loading insights...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Insights</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-400 mb-2">
          <Lightbulb className="w-12 h-12 mx-auto opacity-50" />
        </div>
        <p className="text-gray-500">No insights available at this time</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow"
        >
          {/* Header with icon and category */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">{getCategoryIcon(insight.category)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)} ·{' '}
                  {insight.dataSource}
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceBadgeColor(insight.confidence)}`}>
              {formatConfidence(insight.confidence)} confidence
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 text-justify">{insight.description}</p>

          {/* Metadata if available */}
          {Object.keys(insight.metadata).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                {Object.entries(insight.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * InsightFeedHeader Component
 * Optional header to display above feed
 */
interface InsightFeedHeaderProps {
  count: number
  summary?: string | null
  executionTime?: number | null
}

export function InsightFeedHeader({ count, summary, executionTime }: InsightFeedHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Insights</h2>
      <p className="text-gray-600">
        {count} insight{count !== 1 ? 's' : ''} found
        {executionTime && ` (analyzed in ${executionTime}ms)`}
      </p>
      {summary && <p className="text-sm text-gray-500 mt-2">{summary}</p>}
    </div>
  )
}
