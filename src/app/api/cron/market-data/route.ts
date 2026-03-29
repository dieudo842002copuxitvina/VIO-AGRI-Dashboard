export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

import { ingestCommodityPrices } from '@/services/data/commodity-ingestion'

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return true
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await ingestCommodityPrices('cron')
    const status = summary.success ? 200 : 500

    return NextResponse.json(
      {
        ok: summary.success,
        summary,
      },
      { status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

