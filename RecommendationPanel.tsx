/**
 * RecommendationPanel Component
 * 
 * Displays actionable recommendations in cards
 * Pure presentation - no business logic
 * 
 * Props: { recommendations: Recommendation[], loading: boolean, error: string | null }
 */

'use client'

import type { Recommendation } from '@/decision.types'
import { AlertCircle, CheckCircle, Info, Zap } from 'lucide-react'

interface RecommendationPanelProps {
  recommendations: Recommendation[]
  loading?: boolean
  error?: string | null
  onActionClick?: (recommendation: Recommendation) => void
}

/**
 * Get icon based on recommendation type
 */
function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'action':
      return <Zap className="w-5 h-5 text-yellow-500" />
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case 'opportunity':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    default:
      return <Info className="w-5 h-5 text-blue-500" />
  }
}

/**
 * Get priority badge color
 */
function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

/**
 * Get card border color based on priority
 */
function getCardBorderColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'border-l-red-500'
    case 'high':
      return 'border-l-orange-500'
    case 'medium':
      return 'border-l-yellow-500'
    case 'low':
      return 'border-l-green-500'
    default:
      return 'border-l-gray-500'
  }
}

/**
 * Format confidence percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

/**
 * RecommendationCard Component
 */
interface RecommendationCardProps {
  recommendation: Recommendation
  onActionClick?: (recommendation: Recommendation) => void
}

function RecommendationCard({ recommendation, onActionClick }: RecommendationCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${getCardBorderColor(recommendation.priority)} hover:shadow-lg transition-shadow`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-1">{getTypeIcon(recommendation.type)}</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{recommendation.title}</h3>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
              {recommendation.type} • {recommendation.targetAudience}
            </p>
          </div>
        </div>
      </div>

      {/* Priority and Confidence Badges */}
      <div className="flex gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded border ${getPriorityBadgeColor(recommendation.priority)}`}>
          {recommendation.priority.toUpperCase()}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700">
          {formatConfidence(recommendation.confidence)} confidence
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-3">{recommendation.description}</p>

      {/* Reasoning */}
      {recommendation.reasoning.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Why this recommendation:</p>
          <ul className="text-xs text-gray-700 space-y-1">
            {recommendation.reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onActionClick?.(recommendation)}
          className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
        >
          <span>{recommendation.suggestedAction}</span>
        </button>
        <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 text-center">{recommendation.expectedImpact}</p>
        </div>
      </div>

      {/* Expires at */}
      {recommendation.expiresAt && (
        <p className="text-xs text-gray-400 mt-2">
          Expires: {new Date(recommendation.expiresAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

/**
 * RecommendationPanel Component
 */
export function RecommendationPanel({
  recommendations,
  loading = false,
  error = null,
  onActionClick,
}: RecommendationPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Loading recommendations...</p>
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
            <h3 className="font-semibold text-red-900">Error Loading Recommendations</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-400 mb-2">
          <CheckCircle className="w-12 h-12 mx-auto opacity-50" />
        </div>
        <p className="text-gray-500">No recommendations available</p>
      </div>
    )
  }

  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...recommendations].sort(
    (a, b) => (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
  )

  return (
    <div className="space-y-3">
      {sorted.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} onActionClick={onActionClick} />
      ))}
    </div>
  )
}

/**
 * RecommendationPanelHeader Component
 * Optional header to display above panel
 */
interface RecommendationPanelHeaderProps {
  count: number
  criticalCount?: number
  highCount?: number
  summary?: string | null
}

export function RecommendationPanelHeader({
  count,
  criticalCount = 0,
  highCount = 0,
  summary,
}: RecommendationPanelHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommendations</h2>
      <div className="flex flex-wrap gap-4 text-sm">
        <p className="text-gray-600">
          {count} recommendation{count !== 1 ? 's' : ''}
        </p>
        {criticalCount > 0 && (
          <span className="text-red-600 font-semibold">
            ⚠️ {criticalCount} critical
          </span>
        )}
        {highCount > 0 && (
          <span className="text-orange-600 font-semibold">
            ⚡ {highCount} high priority
          </span>
        )}
      </div>
      {summary && <p className="text-sm text-gray-500 mt-2">{summary}</p>}
    </div>
  )
}
