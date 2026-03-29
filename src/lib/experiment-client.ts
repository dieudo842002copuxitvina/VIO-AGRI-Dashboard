import type {
  ExperimentAssignmentResult,
  ExperimentId,
  ExperimentTrackInput,
  ExperimentTrackResult,
} from '@/modules/experiment/experiment.types'

const DEFAULT_EXPERIMENT_ID: ExperimentId = 'cta_button_test'
const ANONYMOUS_USER_STORAGE_KEY = 'vio_agri_experiment_user_id'

export function getOrCreateExperimentUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-anonymous-user'
  }

  const existing = window.localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const nextId =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `anon-${Date.now()}-${Math.round(Math.random() * 100000)}`

  window.localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, nextId)
  return nextId
}

export async function assignExperimentVariant(
  userId: string,
  experimentId: ExperimentId = DEFAULT_EXPERIMENT_ID
): Promise<ExperimentAssignmentResult | null> {
  try {
    const response = await fetch('/api/experiment/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        experiment_id: experimentId,
      }),
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as ExperimentAssignmentResult
  } catch {
    return null
  }
}

export function trackExperimentEvent(
  input: Omit<ExperimentTrackInput, 'experiment_id'> & { experiment_id?: ExperimentId }
): Promise<ExperimentTrackResult | null> {
  const payload = {
    ...input,
    experiment_id: input.experiment_id || DEFAULT_EXPERIMENT_ID,
    timestamp: input.timestamp || new Date().toISOString(),
  }

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      })
      const sent = navigator.sendBeacon('/api/experiment/track', blob)
      if (sent) {
        return Promise.resolve(null)
      }
    } catch {
      // fall through to fetch keepalive
    }
  }

  return fetch('/api/experiment/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .then(async (response) => {
      if (!response.ok) {
        return null
      }

      return (await response.json()) as ExperimentTrackResult
    })
    .catch(() => null)
}
