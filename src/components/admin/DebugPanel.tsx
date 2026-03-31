'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'

import type { DebugResponseState } from '@/components/admin/types'

const initialState: DebugResponseState = {
  loading: false,
  error: null,
  data: null,
}

type DebugEndpoint = '/api/decision' | '/api/recommendation'

export default function DebugPanel() {
  const [decisionState, setDecisionState] = useState<DebugResponseState>(initialState)
  const [recommendationState, setRecommendationState] = useState<DebugResponseState>(initialState)

  const runRequest = async (
    endpoint: DebugEndpoint,
    setState: Dispatch<SetStateAction<DebugResponseState>>
  ) => {
    setState({
      loading: true,
      error: null,
      data: null,
    })

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
      })
      const json = await response.json()

      if (!response.ok) {
        const details =
          typeof json === 'object' &&
          json !== null &&
          'message' in json &&
          typeof json.message === 'string'
            ? `: ${json.message}`
            : ''

        setState({
          loading: false,
          error: `Request failed with status ${response.status}${details}`,
          data: json,
        })
        return
      }

      setState({
        loading: false,
        error: null,
        data: json,
      })
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred.',
        data: null,
      })
    }
  }

  const renderResponse = (state: DebugResponseState) => {
    if (state.loading) {
      return <p className="text-sm text-neutral-500">Loading response...</p>
    }

    return (
      <div className="space-y-3">
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <pre className="min-h-40 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-950 p-4 text-xs text-neutral-100">
          {state.data ? JSON.stringify(state.data, null, 2) : 'No response yet.'}
        </pre>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">API Debug Panel</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Use these controls to call the mock API routes and inspect their raw JSON responses
          for quick debugging in the admin panel.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-neutral-900">Decision API</h3>
              <p className="text-xs text-neutral-500">Calls /api/decision</p>
            </div>
            <button
              type="button"
              onClick={() => runRequest('/api/decision', setDecisionState)}
              disabled={decisionState.loading}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {decisionState.loading ? 'Loading...' : 'Call endpoint'}
            </button>
          </div>
          {renderResponse(decisionState)}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-neutral-900">Recommendation API</h3>
              <p className="text-xs text-neutral-500">Calls /api/recommendation</p>
            </div>
            <button
              type="button"
              onClick={() => runRequest('/api/recommendation', setRecommendationState)}
              disabled={recommendationState.loading}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recommendationState.loading ? 'Loading...' : 'Call endpoint'}
            </button>
          </div>
          {renderResponse(recommendationState)}
        </div>
      </div>
    </section>
  )
}