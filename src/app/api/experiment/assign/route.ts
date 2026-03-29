import { NextRequest, NextResponse } from 'next/server'

import { assignVariant, calculateExperimentMetrics } from '@/modules/experiment/experiment.engine'
import type {
  ExperimentAssignmentInput,
  ExperimentAssignmentResult,
} from '@/modules/experiment/experiment.types'

interface AssignErrorResponse {
  error: string
  message: string
  timestamp: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExperimentAssignmentResult | AssignErrorResponse>> {
  try {
    const body = (await request.json()) as Partial<ExperimentAssignmentInput>
    const userId = typeof body?.user_id === 'string' ? body.user_id.trim() : ''

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'user_id is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const assignment = await assignVariant({
      user_id: userId,
      experiment_id: body.experiment_id,
    })

    return NextResponse.json(assignment, { status: 200 })
  } catch (error) {
    console.error('[Experiment Assign API] Failed to assign variant', {
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
  const metrics = await calculateExperimentMetrics('cta_button_test')

  return NextResponse.json(
    {
      status: 'ok',
      experiment_id: 'cta_button_test',
      winner: metrics.winner,
      total_assignments: metrics.totalAssignments,
      evaluated_at: metrics.evaluated_at,
    },
    { status: 200 }
  )
}
