import { NextRequest, NextResponse } from 'next/server'

import { createNegotiation } from '@/modules/negotiation/negotiation.engine'
import type { CreateNegotiationInput } from '@/modules/negotiation/negotiation.types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<CreateNegotiationInput>
    const listingId = typeof body?.listing_id === 'string' ? body.listing_id.trim() : ''
    const buyerId = typeof body?.buyer_id === 'string' ? body.buyer_id.trim() : ''
    const sellerId = typeof body?.seller_id === 'string' ? body.seller_id.trim() : undefined
    const offeredPrice =
      typeof body?.offered_price === 'number' ? body.offered_price : Number(body?.offered_price)

    if (!listingId || !buyerId || !Number.isFinite(offeredPrice) || offeredPrice <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'listing_id, buyer_id, and offered_price are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const negotiation = await createNegotiation({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      offered_price: offeredPrice,
      note: body.note,
    })

    if (!negotiation) {
      return NextResponse.json(
        {
          error: 'Negotiation creation failed',
          message: 'Unable to create negotiation. Check listing, buyer, and database schema.',
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ negotiation }, { status: 201 })
  } catch (error) {
    console.error('[Negotiation Create API] Failed to create negotiation', {
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
