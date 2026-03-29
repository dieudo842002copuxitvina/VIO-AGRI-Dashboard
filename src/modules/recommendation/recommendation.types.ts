/**
 * Recommendation System Type Definitions
 * Comprehensive interfaces for product, action, and affiliate recommendations
 *
 * Architecture designed for extensibility and ML integration
 */

import {
  UserProfile,
  UserBehavior,
  MarketData,
} from '@/modules/decision/decision.types'

export type RecommendationType = 'product' | 'action' | 'affiliate'

export type ProductCategory =
  | 'iot_sensor'
  | 'irrigation_system'
  | 'fertilizer'
  | 'pesticide'
  | 'equipment'
  | 'software'
  | 'service'

export type RecommendationAction =
  | 'sell_now'
  | 'hold'
  | 'buy'
  | 'increase_production'
  | 'diversify'

export type MarketRecommendationAction = 'BUY' | 'SELL' | 'HOLD'

export type ClimateRiskLevel = 'low' | 'moderate' | 'medium' | 'high' | 'critical'

export interface RecommendationFactorWeights {
  interest_match: number
  market_trend: number
  climate_risk: number
  user_quality: number
}

export interface ScoringComponent {
  name: string
  weight: number
  value: number
  reasoning: string[]
  contribution?: number
  dataQuality?: number
}

export interface RecommendationExplainability {
  weights: RecommendationFactorWeights
  components: ScoringComponent[]
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  description: string
  manufacturer?: string
  target_crops?: string[]
  target_regions?: string[]
  features?: Record<string, unknown>
  rating?: number
  affiliate_link?: string
}

export interface RecommendationBase {
  id: string
  type: RecommendationType
  title: string
  description: string
  score: number
  confidence: number
  reasons: string[]
  reasoning?: string[]
  scoringBreakdown: ScoringComponent[]
  explainability?: RecommendationExplainability
  priority: 'low' | 'medium' | 'high' | 'critical'
  expiresAt?: Date
  metadata: Record<string, unknown>
}

export interface ProductRecommendation extends RecommendationBase {
  type: 'product'
  product: Product
  estimatedBenefit: string
  implementation_time?: string
  roi_estimate?: number
}

export interface ActionRecommendation extends RecommendationBase {
  type: 'action'
  action: RecommendationAction
  commodity_id?: string
  commodity_name?: string
  target_price?: number
  suggested_quantity?: number
  timeframe?: string
  risk_level: 'low' | 'medium' | 'high'
}

export interface AffiliateRecommendation extends RecommendationBase {
  type: 'affiliate'
  affiliate_link: string
  product_name: string
  commission_rate?: number
  partner: string
}

export type Recommendation =
  | ProductRecommendation
  | ActionRecommendation
  | AffiliateRecommendation

export interface RecommendationContext {
  userProfile: UserProfile
  userBehavior: UserBehavior
  marketData: MarketData[]
  climateRisk: ClimateRiskLevel
  seasonalFactors?: Record<string, number>
  executionTimestamp: Date
}

export interface RecommendationOutput {
  userId: string
  timestamp: Date
  recommendations: Recommendation[]
  summary: string
  executionTime: number
  context: {
    totalScored: number
    topRecommendations: number
  }
}

export interface ScoringModel {
  version: string
  type: 'rule-based' | 'ml-model' | 'hybrid'
  weights: RecommendationFactorWeights
  thresholds: Record<string, number>
  metadata?: Record<string, unknown>
}

export interface UserInterestProfile {
  userId: string
  interested_categories: ProductCategory[]
  interested_actions: RecommendationAction[]
  risk_aversion: number
  budget_range: {
    min: number
    max: number
  }
  climate_concerns: string[]
  sustainability_importance: number
}

export interface MarketTrendScore {
  commodityId: string
  commodityName: string
  priceDirection: 'up' | 'down' | 'stable'
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  volatilityScore: number
  demandScore: number
  supplyScore: number
}

export interface ClimateRiskAssessment {
  region: string
  riskLevel: ClimateRiskLevel
  factors: string[]
  affectedCrops: string[]
  mitigationProducts?: string[]
  urgency: number
}

export interface RecommendationFilter {
  types?: RecommendationType[]
  minScore?: number
  minConfidence?: number
  categories?: ProductCategory[]
  maxResults?: number
  priorityOnly?: boolean
}

export interface RecommendationEngineConfig {
  enableProductRecommendations?: boolean
  enableActionRecommendations?: boolean
  enableAffiliateRecommendations?: boolean
  scoringModel?: ScoringModel
  minScoreThreshold?: number
  maxRecommendations?: number
  cacheTTLSeconds?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface RecommendationAnalytics {
  recommendationId: string
  userId: string
  type: RecommendationType
  shown: boolean
  clicked?: boolean
  converted?: boolean
  feedback?: number
  timestamp: Date
}

export interface RecommendationScoringUserInput {
  userId?: string
  interests?: string[]
  region?: string
  role?: string
  qualityScore?: number
  completionRate?: number
  profileCompleteness?: number
}

export interface RecommendationScoringMarketInput {
  commodity?: string
  commodityId?: string
  price?: number
  trend?: string
  region?: string
  demandLevel?: string
  supplyLevel?: string
  volatilityIndex?: number
}

export interface RecommendationScoringClimateInput {
  risk_level?: ClimateRiskLevel | string
  region?: string
}

export interface ScoredCommodityRecommendation {
  commodity: string
  commodityId?: string
  action: MarketRecommendationAction
  score: number
  confidence: number
  reasoning: string[]
  explainability: RecommendationExplainability
  targetPrice?: number
}
