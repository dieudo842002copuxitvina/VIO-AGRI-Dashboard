import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type ListingProfileRow = {
  business_name: string | null
  trust_score: number | null
  verified: boolean | null
}

type ListingRow = {
  id: string
  created_at: string | null
  user_id: string | null
  type: string | null
  commodity: string | null
  quantity: number | string | null
  price: number | string | null
  status: string | null
  is_boosted: boolean | null
  user_profiles: ListingProfileRow | ListingProfileRow[] | null
}

function extractProfile(profile: ListingRow['user_profiles']): ListingProfileRow | null {
  if (Array.isArray(profile)) {
    return profile[0] ?? null
  }

  return profile ?? null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Unknown error occurred'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')?.trim()
    const commodity = searchParams.get('commodity')?.trim()

    let query = supabase
      .from('listings')
      .select(
        `
          id,
          created_at,
          user_id,
          type,
          commodity,
          quantity,
          price,
          status,
          is_boosted,
          user_profiles (
            business_name,
            trust_score,
            verified
          )
        `
      )
      .eq('status', 'active')

    if (type) {
      query = query.eq('type', type)
    }

    if (commodity) {
      query = query.ilike('commodity', `%${commodity}%`)
    }

    const { data, error } = await query.order('is_boosted', { ascending: false }).order('created_at', {
      ascending: false,
    })

    if (error) {
      console.error('[Listings API] Failed to fetch listings', {
        error: error.message,
      })

      return NextResponse.json(
        {
          error: 'Failed to fetch listings.',
          details: error.message,
        },
        { status: 500 }
      )
    }

    const listings = ((Array.isArray(data) ? data : []) as ListingRow[]).map((listing) => {
      const userProfile = extractProfile(listing.user_profiles)

      return {
        ...listing,
        business_name: userProfile?.business_name || null,
        trust_score: userProfile?.trust_score || null,
        verified: Boolean(userProfile?.verified),
        user_profiles: undefined,
      }
    })

    return NextResponse.json(listings, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('[Listings API] Unexpected failure', {
      error: message,
    })

    return NextResponse.json(
      {
        error: 'An unexpected error occurred.',
        details: message,
      },
      { status: 500 }
    )
  }
}
