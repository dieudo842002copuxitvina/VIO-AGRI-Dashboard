/**
 * useDecision Hook - To be placed in: hooks/useDecision.ts
 * 
 * Manages Decision Engine API calls and state
 * Handles loading, error states, and data caching
 * 
 * Usage:
 * const { insights, recommendations, loading, error, refetch } = useDecision('user_001')
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Insight, Recommendation, DecisionOutput } from '@/decision.types'

interface UseDecisionState {
  insights: Insight[]
  recommendations: Recommendation[]
  loading: boolean
  error: string | null
  executionTime: number | null
  summary: string | null
}

interface UseDecisionResult extends UseDecisionState {
  refetch: () => Promise<void>
}

const DECISION_API_URL = '/api/decision'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Simple in-memory cache for responses
const cache = new Map<string, { data: DecisionOutput; timestamp: number }>()

/**
 * Fetch decision data from API
 */
async function fetchDecisionData(userId: string): Promise<DecisionOutput> {
  const response = await fetch(DECISION_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch decision data')
  }

  return response.json() as Promise<DecisionOutput>
}

/**
 * Get cached data if available and fresh
 */
function getCachedData(userId: string): DecisionOutput | null {
  const cached = cache.get(userId)
  if (!cached) return null

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION
  if (isExpired) {
    cache.delete(userId)
    return null
  }

  return cached.data
}

/**
 * React hook for Decision Engine data
 */
export function useDecision(userId: string | null = 'user_001'): UseDecisionResult {
  const [state, setState] = useState<UseDecisionState>({
    insights: [],
    recommendations: [],
    loading: false,
    error: null,
    executionTime: null,
    summary: null,
  })

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!userId) {
      setState({
        insights: [],
        recommendations: [],
        loading: false,
        error: 'User ID is required',
        executionTime: null,
        summary: null,
      })
      return
    }

    // Check cache first
    const cachedData = getCachedData(userId)
    if (cachedData) {
      setState({
        insights: cachedData.insights,
        recommendations: cachedData.recommendations,
        loading: false,
        error: null,
        executionTime: cachedData.executionTime,
        summary: cachedData.summary,
      })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await fetchDecisionData(userId)

      // Cache the result
      cache.set(userId, { data, timestamp: Date.now() })

      setState({
        insights: data.insights,
        recommendations: data.recommendations,
        loading: false,
        error: null,
        executionTime: data.executionTime,
        summary: data.summary,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState({
        insights: [],
        recommendations: [],
        loading: false,
        error: errorMessage,
        executionTime: null,
        summary: null,
      })
    }
  }, [userId])

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchData()
  }, [userId, fetchData])

  // Return state with refetch function
  return {
    ...state,
    refetch: fetchData,
  }
}

/**
 * Hook to clear cache (useful for testing)
 */
export function useClearDecisionCache(): () => void {
  return useCallback(() => {
    cache.clear()
  }, [])
}

/**
 * Hook to manually set cache (useful for offline/testing)
 */
export function useSetDecisionCache(): (userId: string, data: DecisionOutput) => void {
  return useCallback((userId: string, data: DecisionOutput) => {
    cache.set(userId, { data, timestamp: Date.now() })
  }, [])
}
