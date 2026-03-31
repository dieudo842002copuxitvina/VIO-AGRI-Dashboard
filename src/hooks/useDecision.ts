'use client' // ✅ LUÔN LUÔN DÒNG 1

import { useEffect, useState, useCallback } from 'react'
import { Insight, Recommendation } from '@/types/decision'

interface UseDecisionReturn {
  insights: Insight[]
  recommendations: Recommendation[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDecision(userId?: string): UseDecisionReturn {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/decision', {
        method: 'POST',
        body: JSON.stringify({ userId })
      })

      const data = await res.json()

      setInsights(data?.insights || [])
      setRecommendations(data?.recommendations || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    insights,
    recommendations,
    loading,
    error,
    refetch: fetchData
  }
}