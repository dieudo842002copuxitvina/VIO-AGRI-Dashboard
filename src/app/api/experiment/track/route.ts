import { NextRequest, NextResponse } from 'next/server'

import { trackEvent } from '@/modules/experiment/experiment.engine'
import type {
  ExperimentTrackInput,
  ExperimentTrackResult,
} from '@/modules/experiment/experiment.types'

interface TrackErrorResponse {
  error: string
  message: string
  timestamp: string
}

const ALLOWED_VARIANTS = new Set(['A', 'B', 'C'])
const ALLOWED_EVENTS = new Set([
  'assignment',
  'click_sell',
  'click_post_listing',
  'click_contact_buyer',
  'conversion',
  'purchase_completed',
  'listing_completed',
  'buyer_contact_completed',
])

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExperimentTrackResult | TrackErrorResponse>> {
  try {
    const body = (await request.json()) as Partial<ExperimentTrackInput>
    const userId = typeof body?.user_id === 'string' ? body.user_id.trim() : ''
    const variant = typeof body?.variant === 'string' ? body.variant.trim().toUpperCase() : ''
    const event = typeof body?.event === 'string' ? body.event.trim() : ''

    if (!userId || !variant || !event) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'user_id, variant, and event are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (!ALLOWED_VARIANTS.has(variant) || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'variant or event is not supported',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const result = await trackEvent({
      user_id: userId,
      experiment_id: body.experiment_id,
      variant: variant as ExperimentTrackInput['variant'],
      event: event as ExperimentTrackInput['event'],
      timestamp: body.timestamp,
      revenue_amount: body.revenue_amount,
      metadata: body.metadata,
    })

    return NextResponse.json(result, { status: 202 })
  } catch (error) {
    console.error('[Experiment Track API] Failed to track event', {
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
      endpoint: 'experiment-track',
      accepted_events: Array.from(ALLOWED_EVENTS),
      accepted_variants: Array.from(ALLOWED_VARIANTS),
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
