import { createHash, randomUUID } from 'node:crypto'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  ExperimentAssignmentInput,
  ExperimentAssignmentResult,
  ExperimentDefinition,
  ExperimentId,
  ExperimentMetrics,
  ExperimentTrackInput,
  ExperimentTrackResult,
  ExperimentVariant,
  ExperimentVariantKey,
  ExperimentVariantMetrics,
  GrowthEventName,
} from '@/modules/experiment/experiment.types'

const DEFAULT_EXPERIMENT_ID: ExperimentId = 'cta_button_test'
const METRICS_CACHE_TTL_MS = 5 * 60 * 1000
const CLICK_EVENTS: GrowthEventName[] = ['click_sell', 'click_post_listing', 'click_contact_buyer']
const CONVERSION_EVENTS: GrowthEventName[] = [
  'conversion',
  'purchase_completed',
  'listing_completed',
  'buyer_contact_completed',
]

const experimentDefinitions: Record<ExperimentId, ExperimentDefinition> = {
  cta_button_test: {
    experiment_id: 'cta_button_test',
    minimumAssignmentsForAutopilot: 300,
    variants: [
      { key: 'A', label: 'Sell Now', rolloutPercentage: 34 },
      { key: 'B', label: 'Get Best Price', rolloutPercentage: 33 },
      { key: 'C', label: 'Find Buyers Fast', rolloutPercentage: 33 },
    ],
  },
}

const metricsCache = new Map<ExperimentId, { expiresAt: number; metrics: ExperimentMetrics }>()

function getExperimentDefinition(experimentId: ExperimentId = DEFAULT_EXPERIMENT_ID): ExperimentDefinition {
  return experimentDefinitions[experimentId]
}

function toSafeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function toSafeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))
      ? Number(value)
      : fallback
}

function normalizeVariantKey(value: unknown): ExperimentVariantKey | null {
  const safeValue = toSafeText(value).toUpperCase()

  if (safeValue === 'A' || safeValue === 'B' || safeValue === 'C') {
    return safeValue
  }

  return null
}

function normalizeExperimentId(value: unknown): ExperimentId {
  return value === 'cta_button_test' ? value : DEFAULT_EXPERIMENT_ID
}

function hashUserBucket(experimentId: ExperimentId, userId: string): number {
  const hash = createHash('sha256')
    .update(`${experimentId}:${userId}`)
    .digest('hex')
    .slice(0, 8)

  return Number.parseInt(hash, 16) % 100
}

function resolveVariantFromBucket(bucket: number, variants: ExperimentVariant[]): ExperimentVariant {
  let cursor = 0

  for (const variant of variants) {
    cursor += variant.rolloutPercentage
    if (bucket < cursor) {
      return variant
    }
  }

  return variants[variants.length - 1]
}

async function logAssignment(result: ExperimentAssignmentResult): Promise<void> {
  try {
    const supabase = getSupabaseServerClient()

    const { error } = await supabase.from('experiment_assignments').upsert(
      {
        experiment_id: result.experiment_id,
        user_id: result.user_id,
        variant: result.variant,
        label: result.label,
        assigned_at: result.assigned_at,
        hash_bucket: result.hash_bucket,
        finalized: result.finalized,
      },
      {
        onConflict: 'experiment_id,user_id',
      }
    )

    if (error) {
      console.error('[Experiment] Failed to persist assignment', {
        experimentId: result.experiment_id,
        userId: result.user_id,
        error: error.message,
      })
    }
  } catch (error) {
    console.error('[Experiment] Unexpected assignment logging error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

async function countAssignmentsByVariant(
  experimentId: ExperimentId,
  variant: ExperimentVariantKey
): Promise<number> {
  try {
    const supabase = getSupabaseServerClient()
    const { count, error } = await supabase
      .from('experiment_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('variant', variant)

    if (error) {
      console.error('[Experiment] Failed to count assignments', {
        experimentId,
        variant,
        error: error.message,
      })
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('[Experiment] Unexpected assignment count error', {
      experimentId,
      variant,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 0
  }
}

async function countEventsByVariant(
  experimentId: ExperimentId,
  variant: ExperimentVariantKey,
  events: GrowthEventName[]
): Promise<number> {
  try {
    const supabase = getSupabaseServerClient()
    const { count, error } = await supabase
      .from('experiment_events')
      .select('*', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('variant', variant)
      .in('event', events)

    if (error) {
      console.error('[Experiment] Failed to count events', {
        experimentId,
        variant,
        error: error.message,
      })
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('[Experiment] Unexpected event count error', {
      experimentId,
      variant,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 0
  }
}

async function sumRevenueByVariant(
  experimentId: ExperimentId,
  variant: ExperimentVariantKey
): Promise<number> {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('experiment_events')
      .select('revenue_amount')
      .eq('experiment_id', experimentId)
      .eq('variant', variant)
      .in('event', CONVERSION_EVENTS)

    if (error) {
      console.error('[Experiment] Failed to sum revenue', {
        experimentId,
        variant,
        error: error.message,
      })
      return 0
    }

    return (data || []).reduce((sum, row) => sum + toSafeNumber(row.revenue_amount, 0), 0)
  } catch (error) {
    console.error('[Experiment] Unexpected revenue aggregation error', {
      experimentId,
      variant,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 0
  }
}

function computeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0
  }

  return Math.round((numerator / denominator) * 10000) / 10000
}

function selectWinningVariant(
  experiment: ExperimentDefinition,
  metrics: ExperimentVariantMetrics[],
  totalAssignments: number
): ExperimentVariantKey | null {
  if (totalAssignments < experiment.minimumAssignmentsForAutopilot) {
    return null
  }

  const sorted = [...metrics].sort((left, right) => {
    if (right.conversionRate !== left.conversionRate) {
      return right.conversionRate - left.conversionRate
    }

    if (right.revenuePerUser !== left.revenuePerUser) {
      return right.revenuePerUser - left.revenuePerUser
    }

    if (right.ctr !== left.ctr) {
      return right.ctr - left.ctr
    }

    return left.variant.localeCompare(right.variant)
  })

  return sorted[0]?.variant || null
}

function getCachedMetrics(experimentId: ExperimentId): ExperimentMetrics | null {
  const cached = metricsCache.get(experimentId)

  if (!cached) {
    return null
  }

  if (cached.expiresAt <= Date.now()) {
    metricsCache.delete(experimentId)
    return null
  }

  return cached.metrics
}

function setCachedMetrics(metrics: ExperimentMetrics): void {
  metricsCache.set(metrics.experiment_id, {
    expiresAt: Date.now() + METRICS_CACHE_TTL_MS,
    metrics,
  })
}

export async function calculateExperimentMetrics(
  experimentId: ExperimentId = DEFAULT_EXPERIMENT_ID
): Promise<ExperimentMetrics> {
  const cached = getCachedMetrics(experimentId)
  if (cached) {
    return cached
  }

  const experiment = getExperimentDefinition(experimentId)
  const variantMetrics = await Promise.all(
    experiment.variants.map(async (variant) => {
      const [assignments, clicks, conversions, revenue] = await Promise.all([
        countAssignmentsByVariant(experimentId, variant.key),
        countEventsByVariant(experimentId, variant.key, CLICK_EVENTS),
        countEventsByVariant(experimentId, variant.key, CONVERSION_EVENTS),
        sumRevenueByVariant(experimentId, variant.key),
      ])

      return {
        variant: variant.key,
        label: variant.label,
        assignments,
        clicks,
        conversions,
        revenue,
        ctr: computeRate(clicks, assignments),
        conversionRate: computeRate(conversions, assignments),
        revenuePerUser: assignments > 0 ? Math.round((revenue / assignments) * 100) / 100 : 0,
      } satisfies ExperimentVariantMetrics
    })
  )

  const totalAssignments = variantMetrics.reduce((sum, variant) => sum + variant.assignments, 0)
  const winner = selectWinningVariant(experiment, variantMetrics, totalAssignments)

  const metrics: ExperimentMetrics = {
    experiment_id: experimentId,
    totalAssignments,
    variants: variantMetrics,
    winner,
    evaluated_at: new Date().toISOString(),
  }

  setCachedMetrics(metrics)
  return metrics
}

export async function assignVariant(
  input: ExperimentAssignmentInput
): Promise<ExperimentAssignmentResult> {
  const experimentId = normalizeExperimentId(input.experiment_id)
  const safeUserId = toSafeText(input.user_id, randomUUID())
  const experiment = getExperimentDefinition(experimentId)
  const metrics = await calculateExperimentMetrics(experimentId)
  const winningVariantKey = metrics.winner
  const bucket = hashUserBucket(experimentId, safeUserId)
  const resolvedVariant = winningVariantKey
    ? experiment.variants.find((variant) => variant.key === winningVariantKey) ||
      resolveVariantFromBucket(bucket, experiment.variants)
    : resolveVariantFromBucket(bucket, experiment.variants)

  const result: ExperimentAssignmentResult = {
    experiment_id: experimentId,
    user_id: safeUserId,
    variant: resolvedVariant.key,
    label: resolvedVariant.label,
    assigned_at: new Date().toISOString(),
    finalized: winningVariantKey !== null,
    hash_bucket: bucket,
  }

  void logAssignment(result)

  return result
}

export async function trackEvent(
  input: ExperimentTrackInput
): Promise<ExperimentTrackResult> {
  const experimentId = normalizeExperimentId(input.experiment_id)
  const safeUserId = toSafeText(input.user_id, randomUUID())
  const safeVariant = normalizeVariantKey(input.variant) || 'A'
  const safeEvent: GrowthEventName = input.event
  const safeTimestamp = toSafeText(input.timestamp, new Date().toISOString())
  const revenueAmount = Math.max(0, toSafeNumber(input.revenue_amount, 0))

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('experiment_events').insert({
      experiment_id: experimentId,
      user_id: safeUserId,
      variant: safeVariant,
      event: safeEvent,
      event_timestamp: safeTimestamp,
      revenue_amount: revenueAmount,
      metadata: input.metadata || {},
    })

    if (error) {
      console.error('[Experiment] Failed to persist event', {
        experimentId,
        userId: safeUserId,
        variant: safeVariant,
        event: safeEvent,
        error: error.message,
      })
    } else {
      metricsCache.delete(experimentId)
    }
  } catch (error) {
    console.error('[Experiment] Unexpected tracking error', {
      experimentId,
      userId: safeUserId,
      variant: safeVariant,
      event: safeEvent,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return {
    accepted: true,
    experiment_id: experimentId,
    variant: safeVariant,
    event: safeEvent,
    timestamp: safeTimestamp,
  }
}

export function getExperimentDefinitionForClient(
  experimentId: ExperimentId = DEFAULT_EXPERIMENT_ID
): ExperimentDefinition {
  return getExperimentDefinition(experimentId)
}
