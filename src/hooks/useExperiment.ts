'use client'

import { useEffect, useState } from 'react'

import {
  assignExperimentVariant,
  getOrCreateExperimentUserId,
  trackExperimentEvent,
} from '@/lib/experiment-client'
import type {
  ExperimentAssignmentResult,
  ExperimentId,
  ExperimentTrackInput,
} from '@/modules/experiment/experiment.types'

const DEFAULT_EXPERIMENT_ID: ExperimentId = 'cta_button_test'
const DEFAULT_ASSIGNMENT: ExperimentAssignmentResult = {
  experiment_id: DEFAULT_EXPERIMENT_ID,
  user_id: 'anonymous-user',
  variant: 'A',
  label: 'Sell Now',
  assigned_at: new Date(0).toISOString(),
  finalized: false,
  hash_bucket: 0,
}

export function useExperiment(experimentId: ExperimentId = DEFAULT_EXPERIMENT_ID, userId?: string) {
  const [assignment, setAssignment] = useState<ExperimentAssignmentResult>(DEFAULT_ASSIGNMENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadAssignment() {
      setLoading(true)
      const resolvedUserId = userId || getOrCreateExperimentUserId()
      const result = await assignExperimentVariant(resolvedUserId, experimentId)

      if (active) {
        setAssignment(
          result || {
            ...DEFAULT_ASSIGNMENT,
            user_id: resolvedUserId,
            experiment_id: experimentId,
          }
        )
        setLoading(false)
      }
    }

    void loadAssignment()

    return () => {
      active = false
    }
  }, [experimentId, userId])

  async function track(
    event: ExperimentTrackInput['event'],
    overrides?: Partial<Omit<ExperimentTrackInput, 'event' | 'user_id' | 'variant'>>
  ) {
    return trackExperimentEvent({
      user_id: assignment.user_id,
      variant: assignment.variant,
      event,
      experiment_id: assignment.experiment_id,
      revenue_amount: overrides?.revenue_amount,
      metadata: overrides?.metadata,
      timestamp: overrides?.timestamp,
    })
  }

  return {
    assignment,
    loading,
    track,
  }
}
