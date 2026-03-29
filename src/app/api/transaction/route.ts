import { NextRequest, NextResponse } from 'next/server'

import {
  createEscrowTransaction,
  getTransactionById,
  getTransactionByNegotiationId,
  releaseEscrowTransaction,
  updateFulfillment,
} from '@/modules/transaction/transaction.engine'
import type { DeliveryStatus } from '@/modules/transaction/transaction.types'

interface ErrorResponse {
  error: string
  message: string
  timestamp: string
}

const allowedDeliveryStatuses: DeliveryStatus[] = [
  'awaiting_dispatch',
  'in_transit',
  'delivered',
  'completed',
]

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const transactionId = request.nextUrl.searchParams.get('transaction_id') || ''
    const negotiationId = request.nextUrl.searchParams.get('negotiation_id') || ''

    const transaction = transactionId
      ? await getTransactionById(transactionId)
      : negotiationId
        ? await getTransactionByNegotiationId(negotiationId)
        : null

    return NextResponse.json({ transaction }, { status: 200 })
  } catch (error) {
    console.error('[Transaction API] Failed to fetch transaction', {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      action?: string
      negotiation_id?: string
      transaction_id?: string
      amount?: number
      delivery_status?: DeliveryStatus
      logistics_info?: string
    }

    const action = typeof body?.action === 'string' ? body.action.trim().toLowerCase() : ''

    if (action === 'create') {
      const negotiationId = typeof body?.negotiation_id === 'string' ? body.negotiation_id.trim() : ''
      const amount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount)

      if (!negotiationId) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'negotiation_id is required to create escrow',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }

      const transaction = await createEscrowTransaction({
        negotiation_id: negotiationId,
        amount: Number.isFinite(amount) ? amount : undefined,
      })

      if (!transaction) {
        return NextResponse.json(
          {
            error: 'Transaction creation failed',
            message: 'Unable to create escrow transaction. Make sure the negotiation is accepted.',
            timestamp: new Date().toISOString(),
          },
          { status: 422 }
        )
      }

      return NextResponse.json({ transaction }, { status: 201 })
    }

    if (action === 'fulfill') {
      const transactionId = typeof body?.transaction_id === 'string' ? body.transaction_id.trim() : ''
      const deliveryStatus = body?.delivery_status

      if (!transactionId || !deliveryStatus || !allowedDeliveryStatuses.includes(deliveryStatus)) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'transaction_id and a valid delivery_status are required',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }

      const transaction = await updateFulfillment({
        transaction_id: transactionId,
        delivery_status: deliveryStatus,
        logistics_info: body.logistics_info,
      })

      if (!transaction) {
        return NextResponse.json(
          {
            error: 'Fulfillment update failed',
            message: 'Unable to update fulfillment status.',
            timestamp: new Date().toISOString(),
          },
          { status: 422 }
        )
      }

      return NextResponse.json({ transaction }, { status: 200 })
    }

    if (action === 'release') {
      const transactionId = typeof body?.transaction_id === 'string' ? body.transaction_id.trim() : ''

      if (!transactionId) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            message: 'transaction_id is required to release escrow',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }

      const transaction = await releaseEscrowTransaction(transactionId)

      if (!transaction) {
        return NextResponse.json(
          {
            error: 'Escrow release failed',
            message: 'Unable to release escrow funds.',
            timestamp: new Date().toISOString(),
          },
          { status: 422 }
        )
      }

      return NextResponse.json({ transaction }, { status: 200 })
    }

    return NextResponse.json(
      {
        error: 'Invalid request',
        message: 'action must be one of create, fulfill, or release',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Transaction API] Failed to process transaction action', {
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
