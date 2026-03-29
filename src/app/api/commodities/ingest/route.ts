import { NextResponse } from 'next/server'

import { ingestCommodityPrices } from '@/services/data/commodity-ingestion'

export async function POST() {
  try {
    console.log('[Ingest API] Starting commodity price ingestion...')
    const summary = await ingestCommodityPrices('api')

    if (!summary.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Commodity ingestion completed with no successful source writes',
          summary,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: summary.partial
          ? 'Commodity ingestion completed with partial source coverage'
          : 'Commodity prices ingested successfully',
        summary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Ingest API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to ingest commodity prices',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
