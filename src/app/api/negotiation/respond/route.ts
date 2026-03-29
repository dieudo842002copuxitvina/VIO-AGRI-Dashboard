import { NextRequest, NextResponse } from 'next/server'

import { respondToNegotiation } from '@/modules/negotiation/negotiation.engine'
import type { RespondNegotiationInput } from '@/modules/negotiation/negotiation.types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<RespondNegotiationInput>
    const negotiationId = typeof body?.negotiation_id === 'string' ? body.negotiation_id.trim() : ''
    const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : ''

    if (!negotiationId || (status !== 'accepted' && status !== 'rejected')) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'negotiation_id and status (accepted or rejected) are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const negotiation = await respondToNegotiation({
      negotiation_id: negotiationId,
      status,
      note: body.note,
    })

    if (!negotiation) {
      return NextResponse.json(
        {
          error: 'Negotiation update failed',
          message: 'Unable to update negotiation status.',
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ negotiation }, { status: 200 })
  } catch (error) {
    console.error('[Negotiation Respond API] Failed to respond to negotiation', {
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
