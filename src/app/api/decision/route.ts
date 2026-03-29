import { NextResponse } from 'next/server'

import type { DecisionApiResponse, Insight } from '@/modules/decision/decision.contract'
import type { Recommendation } from '@/modules/decision/decision.types'

const rawInsights = [
  {
    title: 'Coffee price rising',
    type: 'opportunity',
    confidence: 0.85,
  },
]

const rawRecommendations = [
  {
    action: 'SELL',
    commodity: 'coffee',
    reason: 'Market trending up',
  },
]

function normalizeInsight(raw: any): Insight {
  const title = (typeof raw?.title === 'string' ? raw.title.trim() : '') || 'No title'
  const type =
    (typeof raw?.type === 'string' ? raw.type.trim() : '') ||
    (typeof raw?.category === 'string' ? raw.category.trim() : '') ||
    'info'
  const confidenceValue = raw?.confidence ?? 0
  const confidence =
    typeof confidenceValue === 'number' && Number.isFinite(confidenceValue)
      ? confidenceValue
      : 0
  const timestamp =
    (typeof raw?.timestamp === 'string' ? raw.timestamp.trim() : '') ||
    new Date().toISOString()
  const id =
    (typeof raw?.id === 'string' ? raw.id.trim() : '') ||
    `insight-${type}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return {
    id,
    title,
    type,
    confidence,
    timestamp,
  }
}

function normalizeRecommendation(raw: any): Recommendation {
  const action = (typeof raw?.action === 'string' ? raw.action.trim() : '') || 'REVIEW'
  const commodity = (typeof raw?.commodity === 'string' ? raw.commodity.trim() : '') || 'market'
  const title =
    (typeof raw?.title === 'string' ? raw.title.trim() : '') || `${action} ${commodity}`
  const description =
    (typeof raw?.description === 'string' ? raw.description.trim() : '') ||
    (typeof raw?.reason === 'string' ? raw.reason.trim() : '') ||
    'No recommendation details available'
  const confidenceValue = raw?.confidence ?? 0
  const confidence =
    typeof confidenceValue === 'number' && Number.isFinite(confidenceValue)
      ? confidenceValue
      : 0

  const rawReasoning = Array.isArray(raw?.reasoning)
    ? raw.reasoning.filter(
        (reason: unknown): reason is string =>
          typeof reason === 'string' && reason.trim().length > 0
      )
    : []

  const reasoning =
    rawReasoning.length > 0
      ? rawReasoning
      : [
          (typeof raw?.reason === 'string' ? raw.reason.trim() : '') ||
            'No supporting reasoning available',
        ]

  const typeValue = (typeof raw?.type === 'string' ? raw.type.trim() : '') || 'action'
  const type: Recommendation['type'] =
    typeValue === 'alert' || typeValue === 'opportunity' ? typeValue : 'action'

  const priorityValue = (typeof raw?.priority === 'string' ? raw.priority.trim() : '') || 'medium'
  const priority: Recommendation['priority'] =
    priorityValue === 'critical' ||
    priorityValue === 'high' ||
    priorityValue === 'low' ||
    priorityValue === 'medium'
      ? priorityValue
      : 'medium'

  const targetAudienceValue =
    (typeof raw?.targetAudience === 'string' ? raw.targetAudience.trim() : '') || 'both'
  const targetAudience: Recommendation['targetAudience'] =
    targetAudienceValue === 'seller' ||
    targetAudienceValue === 'buyer' ||
    targetAudienceValue === 'both'
      ? targetAudienceValue
      : 'both'

  return {
    id:
      (typeof raw?.id === 'string' ? raw.id.trim() : '') ||
      `recommendation-${action.toLowerCase()}-${commodity.toLowerCase()}`,
    type,
    title,
    description,
    priority,
    confidence,
    reasoning,
    suggestedAction:
      (typeof raw?.suggestedAction === 'string' ? raw.suggestedAction.trim() : '') || action,
    expectedImpact:
      (typeof raw?.expectedImpact === 'string' ? raw.expectedImpact.trim() : '') ||
      `Track ${commodity} market movement closely`,
    targetAudience,
  }
}

function buildDecisionResponse(): DecisionApiResponse {
  return {
    insights: rawInsights.map(normalizeInsight),
    recommendations: rawRecommendations.map(normalizeRecommendation),
    summary: '1 normalized insight and 1 normalized recommendation are available.',
    executionTime: 0,
  }
}

export async function GET() {
  return NextResponse.json(buildDecisionResponse())
}

export async function POST() {
  return NextResponse.json(buildDecisionResponse())
}
