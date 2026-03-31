"use client"

import { useAIDebug } from '@/hooks/useAIDebug'
import { UserSelector } from './debug/UserSelector'
import { MarketDataPreview } from './debug/MarketDataPreview'
import { InsightPanel } from './debug/InsightPanel'
import { RecommendationPanel } from './debug/RecommendationPanel'
import { RawJsonViewer } from './debug/RawJsonViewer'

export default function AIDebugPanel() {
  const {
    users,
    marketData,
    selectedUserId,
    isLoading,
    error,
    lastResponse,
    showTrace,
    handleUserChange,
    runAIAnalysis,
    toggleTrace,
    simulateMarketShock,
  } = useAIDebug()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-4">
          <UserSelector users={users} selectedUserId={selectedUserId} onChange={handleUserChange} disabled={isLoading} />
          <button
            onClick={() => selectedUserId && runAIAnalysis(selectedUserId)}
            disabled={isLoading || !selectedUserId}
            className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Running AI...' : 'Run AI Analysis'}
          </button>
          <button
            onClick={simulateMarketShock}
            disabled={isLoading || !selectedUserId}
            className="px-4 py-2 font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-gray-300"
          >
            Simulate Market Shock
          </button>
        </div>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" checked={showTrace} onChange={toggleTrace} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="ml-2 text-sm font-medium text-gray-700">Show Debug Trace</span>
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MarketDataPreview marketData={marketData} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isLoading && (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
              <style jsx>{`.loader { border-top-color: #4f46e5; animation: spinner 1.5s linear infinite; } @keyframes spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow" role="alert">
              <p className="font-bold">API Error {error.status && `(${error.status})`}</p>
              <p>{error.message}</p>
              <p className="text-sm mt-2">Suggestion: Check the browser console and network tab for more details. Ensure the API endpoints are running.</p>
            </div>
          )}

          {lastResponse && !isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InsightPanel insights={lastResponse.decision.insights} showTrace={showTrace} />
                <RecommendationPanel recommendations={lastResponse.recommendation.recommendations} showTrace={showTrace} />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">⚙️ Raw API Response</h3>
                <RawJsonViewer data={lastResponse} />
              </div>
            </div>
          )}

          {!isLoading && !lastResponse && !error && (
            <div className="flex flex-col justify-center items-center h-64 bg-white rounded-lg shadow text-center">
              <p className="text-lg font-semibold text-gray-700">AI Debug Panel</p>
              <p className="text-gray-500">Select a user and click "Run AI Analysis" to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}