import { useEffect, useState } from 'react'

import type { Recommendation } from '@/modules/decision/decision.types'
import { type DecisionApiResponse, type Insight } from '@/modules/decision/decision.contract'

function normalizeDecisionResponse(raw: unknown): DecisionApiResponse {
  const response = raw as Partial<DecisionApiResponse> | null | undefined

  return {
    insights: Array.isArray(response?.insights) ? response.insights : [],
    recommendations: Array.isArray(response?.recommendations) ? response.recommendations : [],
    summary: typeof response?.summary === 'string' ? response.summary : '',
    executionTime:
      typeof response?.executionTime === 'number' && Number.isFinite(response.executionTime)
        ? response.executionTime
        : 0,
  }
}

export function useDecision(_userId?: string) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [summary, setSummary] = useState('')
  const [executionTime, setExecutionTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchDecisionData() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/decision', { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`Decision API request failed with status ${response.status}`)
      }

      const json = await response.json()
      const normalized = normalizeDecisionResponse(json)

      setInsights(normalized.insights)
      setRecommendations(normalized.recommendations)
      setSummary(normalized.summary)
      setExecutionTime(normalized.executionTime)
    } catch (err) {
      console.error(err)
      setInsights([])
      setRecommendations([])
      setSummary('')
      setExecutionTime(0)
      setError(err instanceof Error ? err.message : 'Failed to load decision data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDecisionData()
  }, [])

  const data: DecisionApiResponse = {
    insights,
    recommendations,
    summary,
    executionTime,
  }

  return {
    data,
    insights,
    recommendations,
    summary,
    executionTime,
    loading,
    error,
    refetch: fetchDecisionData,
  }
}
