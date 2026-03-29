import { NextRequest, NextResponse } from 'next/server'

import { getMarketData } from '@/modules/intelligence/intelligence.service'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const region = request.nextUrl.searchParams.get('region') || undefined
    const response = await getMarketData(region)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[Market Data API] Failed to fetch market data', {
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
