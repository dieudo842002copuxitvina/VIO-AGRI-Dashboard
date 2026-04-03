import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CreateDealBody = {
  listing_id?: unknown
  seller_id?: unknown
  agreed_price?: unknown
  agreed_quantity?: unknown
}

const badRequestErrorCodes = new Set(['22P02', '23502', '23503', '23505'])

function toSafeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toSafePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.trim())

    if (Number.isFinite(normalized) && normalized > 0) {
      return normalized
    }
  }

  return null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Unknown error occurred'
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Deals Create API] Missing Supabase environment variables')

    return NextResponse.json(
      {
        error: 'Server configuration error',
        message: 'Supabase environment variables are not configured.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.delete({ name, ...options })
      },
    },
  })

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Deals Create API] Auth lookup failed', { error: authError.message })

      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: authError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to create a deal.',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    let body: CreateDealBody

    try {
      body = (await request.json()) as CreateDealBody
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request body must be valid JSON.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const listingId = toSafeText(body?.listing_id)
    const sellerId = toSafeText(body?.seller_id)
    const agreedPrice = toSafePositiveNumber(body?.agreed_price)
    const agreedQuantity = toSafePositiveNumber(body?.agreed_quantity)

    if (!listingId || !sellerId || agreedPrice === null || agreedQuantity === null) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message:
            'listing_id, seller_id, agreed_price, and agreed_quantity are required and must be valid.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (sellerId === user.id) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Buyer and seller must be different users.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const { data: listingRecord, error: listingLookupError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .maybeSingle()

    if (listingLookupError) {
      console.error('[Deals Create API] Listing lookup failed', {
        error: listingLookupError.message,
        listingId,
      })

      return NextResponse.json(
        {
          error: 'Failed to validate listing',
          message: listingLookupError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    if (!listingRecord) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'The specified listing does not exist.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (toSafeText(listingRecord.user_id) !== sellerId) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'seller_id does not match the owner of the listing.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const commissionAmount = 0

    const { data: deal, error: insertError } = await supabase
      .from('deals')
      .insert([
        {
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
          agreed_price: agreedPrice,
          agreed_quantity: agreedQuantity,
          status: 'negotiating',
          commission_amount: commissionAmount,
        },
      ])
      .select()
      .single()

    if (insertError) {
      const status = badRequestErrorCodes.has(insertError.code ?? '') ? 400 : 500

      console.error('[Deals Create API] Deal insert failed', {
        error: insertError.message,
        code: insertError.code,
        listingId,
        buyerId: user.id,
        sellerId,
      })

      return NextResponse.json(
        {
          error: status === 400 ? 'Invalid deal data' : 'Failed to create deal',
          message: insertError.message,
          timestamp: new Date().toISOString(),
        },
        { status }
      )
    }

    return NextResponse.json({ deal }, { status: 200 })
  } catch (error) {
    console.error('[Deals Create API] Unexpected failure', {
      error: getErrorMessage(error),
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
