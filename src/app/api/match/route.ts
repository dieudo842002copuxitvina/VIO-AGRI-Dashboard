import { NextRequest, NextResponse } from 'next/server'

import { ensureListingLiquidityById, getMinimumLiquidityBuyers } from '@/modules/liquidity/liquidity.service'
import { getMatchScoreThreshold } from '@/modules/match/match.engine'
import type { MatchRequestBody, MatchResponse } from '@/modules/match/match.types'

interface MatchErrorResponse {
  error: string
  message: string
  timestamp: string
}

export async function POST(request: NextRequest): Promise<NextResponse<MatchResponse | MatchErrorResponse>> {
  try {
    const body = (await request.json()) as Partial<MatchRequestBody>
    const listingId = typeof body?.listing_id === 'string' ? body.listing_id.trim() : ''

    if (!listingId) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'listing_id is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const liquidity = await ensureListingLiquidityById(listingId, { notify: false, logEvents: false })

    return NextResponse.json(
      {
        matches: liquidity.matches,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Match API] Failed to match buyers', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'b2b-matching-engine',
      threshold: getMatchScoreThreshold(),
      minimumLiquidityBuyers: getMinimumLiquidityBuyers(),
      cacheTtlMinutes: 5,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}

