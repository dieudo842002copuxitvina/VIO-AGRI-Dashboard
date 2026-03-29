/**
 * Decision Engine Type Definitions
 * Core interfaces for the Data Intelligence Platform
 * 
 * Maintains strict TypeScript types for all decision engine inputs/outputs
 */

/**
 * User profile containing aggregated behavioral and demographic data
 */
export interface UserProfile {
  id: string
  email: string
  region: string
  farmSize: number // in hectares
  cropTypes: string[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  preferredCommunicationChannel: 'email' | 'sms' | 'push' | 'in-app'
  createdAt: Date
  lastActiveAt: Date
  riskTolerance: 'low' | 'medium' | 'high'
}

/**
 * Real-time market data for decision making
 */
export interface MarketData {
  timestamp: Date
  commodityId: string
  commodityName: string
  currentPrice: number
  priceUnit: string
  priceChange24h: number // percentage
  priceChangePercentage24h: number // 0-100
  demandLevel: 'low' | 'medium' | 'high'
  supplyLevel: 'low' | 'medium' | 'high'
  volatilityIndex: number // 0-100
  seasonalityScore: number // -100 to 100
  trendDirection: 'uptrend' | 'downtrend' | 'sideways'
}

/**
 * User behavior metrics and engagement data
 */
export interface UserBehavior {
  userId: string
  listingsCreated: number
  listingsActive: number
  listingsClosed: number
  avgResponseTime: number // minutes
  completionRate: number // 0-1
  cancelationRate: number // 0-1
  avgOrderValue: number // currency
  totalTransactionValue: number // currency
  tradingFrequency: 'low' | 'medium' | 'high'
  accountAge: number // days
  lastTransactionDays: number
  qualityScore: number // 0-100
}

/**
 * Recommendation detail with confidence and reasoning
 */
export interface Recommendation {
  id: string
  type: 'action' | 'alert' | 'opportunity'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number // 0-1
  reasoning: string[]
  suggestedAction: string
  expectedImpact: string
  targetAudience: 'seller' | 'buyer' | 'both'
  expiresAt?: Date
}

/**
 * Market insight extracted from analysis
 */
export interface Insight {
  id: string
  category: 'market' | 'trend' | 'risk' | 'opportunity'
  title: string
  description: string
  dataSource: string
  confidence: number // 0-1
  metadata: Record<string, unknown>
}

/**
 * Decision engine output combining insights and recommendations
 */
export interface DecisionOutput {
  userId: string
  timestamp: Date
  sessionId: string
  insights: Insight[]
  recommendations: Recommendation[]
  summary: string
  executionTime: number // milliseconds
  rulesExecuted: number
  rulesTrigger: string[]
}

/**
 * Rule execution context
 */
export interface RuleContext {
  userProfile: UserProfile
  marketData: MarketData[]
  userBehavior: UserBehavior
  executionTimestamp: Date
}

/**
 * Rule definition interface
 */
export interface Rule {
  id: string
  name: string
  description: string
  priority: number // Higher = execute first
  enabled: boolean
  condition: (context: RuleContext) => boolean
  action: (context: RuleContext) => {
    insights: Insight[]
    recommendations: Recommendation[]
  }
  tags: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * Error type for decision engine operations
 */
export interface DecisionEngineError {
  code: string
  message: string
  timestamp: Date
  context?: Record<string, unknown>
}

/**
 * Configuration for decision engine
 */
export interface DecisionEngineConfig {
  maxRulesToExecute?: number
  executionTimeoutMs?: number
  enableCaching?: boolean
  cacheTTLSeconds?: number
  minConfidenceThreshold?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
