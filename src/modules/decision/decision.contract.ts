import type { Recommendation } from '@/modules/decision/decision.types'

export interface Insight {
  id: string
  title: string
  type: string
  confidence: number
  timestamp: string
}

export interface DecisionApiResponse {
  insights: Insight[]
  recommendations: Recommendation[]
  summary: string
  executionTime: number
}

export const EMPTY_DECISION_RESPONSE: DecisionApiResponse = {
  insights: [],
  recommendations: [],
  summary: '',
  executionTime: 0,
}
