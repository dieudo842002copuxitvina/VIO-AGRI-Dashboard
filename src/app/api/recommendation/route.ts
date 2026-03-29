/**
 * Recommendation Engine API Route
 *
 * Exposes the Recommendation Engine as an HTTP endpoint
 * Generates personalized product and action recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRecommendationEngine } from '@/modules/recommendation/recommendation.engine'
import type {
  RecommendationContext,
  RecommendationFilter,
} from '@/modules/recommendation/recommendation.types'
import { getMockUserProfile, getMockMarketData, getMockUserBehavior } from '@/data/mock-data'

interface ErrorResponse {
  error: string
  message: string
  timestamp: string
}

interface HealthResponse {
  status: 'ok'
  service: string
  version: string
  timestamp: string
}

interface RequestBody {
  userId?: string
  filter?: {
    minScore?: number
    types?: string[]
    maxResults?: number
  }
}

async function buildRecommendationContext(userId: string): Promise<RecommendationContext> {
  try {
    const userProfile = getMockUserProfile(userId)
    const marketData = userProfile.cropTypes.map((crop) => getMockMarketData(crop))
    const userBehavior = getMockUserBehavior(userId)

    return {
      userProfile,
      userBehavior,
      marketData,
      climateRisk: 'moderate',
      executionTimestamp: new Date(),
    }
  } catch (error) {
    throw new Error(
      `Failed to build recommendation context: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now()
    const body = (await request.json()) as RequestBody
    const { userId, filter } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'userId is required and must be a string',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
        { status: 400 }
      )
    }

    const context = await buildRecommendationContext(userId)
    const engine = getRecommendationEngine()

    const recommendationFilter: RecommendationFilter = {
      types: filter?.types as RecommendationFilter['types'],
      minScore: filter?.minScore,
      maxResults: filter?.maxResults,
    }

    const recommendationOutput = await engine.generateRecommendations(
      context,
      recommendationFilter
    )

    const executionTime = Date.now() - startTime

    return NextResponse.json(
      {
        userId,
        timestamp: new Date().toISOString(),
        recommendations: recommendationOutput.recommendations,
        summary: recommendationOutput.summary,
        executionTime,
        filter: recommendationFilter,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Recommendation API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'recommendation-engine-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    } as HealthResponse,
    { status: 200 }
  )
}
