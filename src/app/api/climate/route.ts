import { NextRequest, NextResponse } from 'next/server'

import { getClimateSignals } from '@/modules/intelligence/intelligence.service'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const region = request.nextUrl.searchParams.get('region') || undefined
    const commodityParam = request.nextUrl.searchParams.get('commodity') || ''
    const commodities = commodityParam
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    const response = await getClimateSignals(region, commodities)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[Climate API] Failed to fetch climate signals', {
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
