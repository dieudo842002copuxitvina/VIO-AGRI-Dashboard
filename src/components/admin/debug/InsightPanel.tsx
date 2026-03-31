'use client'

import { DecisionInsight } from '@/components/admin/types'

interface Props {
  insights: DecisionInsight[]
  showTrace: boolean
}

const confidenceColor = (confidence: number) => {
  if (confidence > 0.8) return 'bg-green-100 text-green-800'
  if (confidence > 0.6) return 'bg-blue-100 text-blue-800'
  return 'bg-yellow-100 text-yellow-800'
}

export function InsightPanel({ insights, showTrace }: Props) {
  return (
    <div>
      <h3 className="font-bold text-xl mb-3 text-gray-800">🧠 AI Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className={`font-semibold ${insight.type === 'risk' ? 'text-red-600' : 'text-green-600'}`}>
                  {insight.type === 'risk' ? 'Risk Detected' : 'Opportunity Found'}
                </p>
                <p className="text-gray-800">{insight.title}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${confidenceColor(insight.confidence)}`}>
                {(insight.confidence * 100).toFixed(0)}% Conf.
              </span>
            </div>
            {showTrace && insight.matchedRule && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">Rule Matched: <span className="font-mono">{insight.matchedRule}</span></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}