export type ExperimentId = 'cta_button_test'
export type ExperimentVariantKey = 'A' | 'B' | 'C'

export type GrowthEventName =
  | 'assignment'
  | 'click_sell'
  | 'click_post_listing'
  | 'click_contact_buyer'
  | 'conversion'
  | 'purchase_completed'
  | 'listing_completed'
  | 'buyer_contact_completed'

export interface ExperimentVariant {
  key: ExperimentVariantKey
  label: string
  rolloutPercentage: number
}

export interface ExperimentDefinition {
  experiment_id: ExperimentId
  variants: ExperimentVariant[]
  minimumAssignmentsForAutopilot: number
}

export interface ExperimentAssignmentInput {
  user_id: string
  experiment_id?: ExperimentId
}

export interface ExperimentAssignmentResult {
  experiment_id: ExperimentId
  user_id: string
  variant: ExperimentVariantKey
  label: string
  assigned_at: string
  finalized: boolean
  hash_bucket: number
}

export interface ExperimentTrackInput {
  user_id: string
  experiment_id?: ExperimentId
  event: GrowthEventName
  variant: ExperimentVariantKey
  timestamp?: string
  revenue_amount?: number
  metadata?: Record<string, unknown>
}

export interface ExperimentTrackResult {
  accepted: boolean
  experiment_id: ExperimentId
  variant: ExperimentVariantKey
  event: GrowthEventName
  timestamp: string
}

export interface ExperimentVariantMetrics {
  variant: ExperimentVariantKey
  label: string
  assignments: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  conversionRate: number
  revenuePerUser: number
}

export interface ExperimentMetrics {
  experiment_id: ExperimentId
  totalAssignments: number
  variants: ExperimentVariantMetrics[]
  winner: ExperimentVariantKey | null
  evaluated_at: string
}
