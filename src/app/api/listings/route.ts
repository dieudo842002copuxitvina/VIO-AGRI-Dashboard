import { NextRequest, NextResponse } from 'next/server'

import { createListing, getListings } from '@/modules/listings/listings.service'
import { bootstrapListingLiquidity } from '@/modules/liquidity/liquidity.service'
import type { CreateListingInput, ListingFilters, ListingsResponse } from '@/modules/listings/listings.types'

interface ErrorResponse {
  error: string
  message: string
  timestamp: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ListingsResponse | ErrorResponse>> {
  try {
    const commodity = request.nextUrl.searchParams.get('commodity') || undefined
    const region = request.nextUrl.searchParams.get('region') || undefined
    const sellerId = request.nextUrl.searchParams.get('seller_id') || undefined
    const status = request.nextUrl.searchParams.get('status') || undefined
    const limit = Number(request.nextUrl.searchParams.get('limit') || 24)

    const listings = await getListings({
      commodity,
      region,
      seller_id: sellerId,
      status: status as ListingFilters['status'],
      limit: Number.isFinite(limit) ? limit : 24,
    })

    return NextResponse.json({ listings }, { status: 200 })
  } catch (error) {
    console.error('[Listings API] Failed to fetch listings', {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<CreateListingInput>
    const sellerId = typeof body?.seller_id === 'string' ? body.seller_id.trim() : ''
    const commodity = typeof body?.commodity === 'string' ? body.commodity.trim() : ''
    const region = typeof body?.region === 'string' ? body.region.trim() : ''
    const quantity = typeof body?.quantity === 'number' ? body.quantity : Number(body?.quantity)
    const pricePerUnit =
      typeof body?.price_per_unit === 'number' ? body.price_per_unit : Number(body?.price_per_unit)

    if (!sellerId || !commodity || !region || !Number.isFinite(quantity) || !Number.isFinite(pricePerUnit)) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'seller_id, commodity, region, quantity, and price_per_unit are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const listing = await createListing({
      seller_id: sellerId,
      title: body.title,
      commodity,
      commodity_id: body.commodity_id,
      quantity,
      price_per_unit: pricePerUnit,
      region,
      description: body.description,
    })

    if (!listing) {
      return NextResponse.json(
        {
          error: 'Listing creation failed',
          message: 'Unable to create listing. Check schema migration and payload fields.',
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    const liquidity = await bootstrapListingLiquidity(listing)

    return NextResponse.json({ listing, liquidity }, { status: 201 })
  } catch (error) {
    console.error('[Listings API] Failed to create listing', {
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
