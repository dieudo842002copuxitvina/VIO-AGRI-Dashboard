'use client'

import { AIRecommendation } from '@/components/admin/types'

interface Props {
  recommendations: AIRecommendation[]
  showTrace: boolean
}

export function RecommendationPanel({ recommendations, showTrace }: Props) {
  return (
    <div>
      <h3 className="font-bold text-xl mb-3 text-gray-800">🎯 AI Recommendations</h3>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-lg text-indigo-600">
                {rec.action} <span className="text-gray-700 font-medium">{rec.commodity}</span>
              </p>
              <span className="font-mono text-sm font-bold text-gray-700">{rec.confidenceScore.toFixed(2)}</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-indigo-500 h-2.5 rounded-full"
                style={{ width: `${rec.confidenceScore}%` }}
              ></div>
            </div>

            <p className="text-sm text-gray-600 mb-2">{rec.reasoning}</p>

            {showTrace && rec.scoringBreakdown && (
              <div className="mt-3 text-xs bg-gray-50 p-2 rounded">
                <p className="font-bold mb-1">Scoring Breakdown:</p>
                <ul className="list-disc list-inside">
                  {Object.entries(rec.scoringBreakdown).map(([key, value]) => (
                    <li key={key} className="font-mono text-gray-600">
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}