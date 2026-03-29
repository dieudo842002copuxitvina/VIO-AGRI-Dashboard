import { NextRequest, NextResponse } from 'next/server'

import { getNegotiations } from '@/modules/negotiation/negotiation.engine'

interface ErrorResponse {
  error: string
  message: string
  timestamp: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const listingId = request.nextUrl.searchParams.get('listing_id') || undefined
    const buyerId = request.nextUrl.searchParams.get('buyer_id') || undefined
    const sellerId = request.nextUrl.searchParams.get('seller_id') || undefined
    const limit = Number(request.nextUrl.searchParams.get('limit') || 20)

    const negotiations = await getNegotiations({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      limit: Number.isFinite(limit) ? limit : 20,
    })

    return NextResponse.json({ negotiations }, { status: 200 })
  } catch (error) {
    console.error('[Negotiation API] Failed to fetch negotiations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

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
