import { NextResponse } from 'next/server'
import { Insight, Recommendation } from '@/types/decision'

// Mock raw data
const rawInsights = [
  {
    title: 'Coffee price rising',
    type: 'opportunity',
    confidence: 0.85,
  },
  {
    title: 'Extreme weather warning',
    type: 'risk',
    // missing confidence
  },
  {
    title: null, // missing title
    type: 'info',
    confidence: 0.5,
  },
]

const rawRecommendations = [
  {
    action: 'SELL',
    commodity: 'coffee',
    reason: 'Market trending up',
  },
  {
    action: 'HOLD',
    commodity: 'wheat',
    // missing reason
  },
  {
    action: 'BUY',
    // missing commodity
    reason: 'New trade deal announced',
  },
]

// Normalization functions
function normalizeInsight(raw: unknown): Insight {
  const rawInsight = raw as Partial<Insight>;
  const title = typeof rawInsight?.title === 'string' ? rawInsight.title.trim() : 'No title';

  let type: Insight['type'] = 'info';
  if (rawInsight?.type === 'opportunity' || rawInsight?.type === 'risk' || rawInsight?.type === 'info') {
    type = rawInsight.type;
  }

  const confidence = typeof rawInsight?.confidence === 'number' ? rawInsight.confidence : 0;

  return {
    title,
    type,
    confidence,
  };
}

function normalizeRecommendation(raw: unknown): Recommendation {
  const rawRecommendation = raw as Partial<Recommendation>;

  let action: Recommendation['action'] = 'HOLD';
  if (rawRecommendation?.action === 'BUY' || rawRecommendation?.action === 'SELL' || rawRecommendation?.action === 'HOLD') {
    action = rawRecommendation.action;
  }

  const commodity = typeof rawRecommendation?.commodity === 'string' ? rawRecommendation.commodity.trim() : 'N/A';
  const reason = typeof rawRecommendation?.reason === 'string' ? rawRecommendation.reason.trim() : 'No reason provided';

  return {
    action,
    commodity,
    reason,
  };
}

interface DecisionApiResponse {
  insights: Insight[];
  recommendations: Recommendation[];
}

function buildDecisionResponse(): DecisionApiResponse {
    try {
        const normalizedInsights = rawInsights.map(normalizeInsight);
        const normalizedRecommendations = rawRecommendations.map(normalizeRecommendation);

        return {
            insights: normalizedInsights,
            recommendations: normalizedRecommendations,
        };
    } catch (error) {
        console.error('Error building decision response:', error);
        return {
            insights: [],
            recommendations: [],
        };
    }
}

export async function GET() {
  return NextResponse.json(buildDecisionResponse())
}

export async function POST() {
  return NextResponse.json(buildDecisionResponse())
}

