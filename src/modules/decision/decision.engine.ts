/**
 * Decision Engine Core Implementation
 * Production-ready engine that evaluates rules and generates insights/recommendations
 * 
 * Architectural principles:
 * - No UI logic (pure backend)
 * - Async-first design
 * - Comprehensive error handling
 * - Performance monitoring
 * - Rule-based architecture
 */

import {
  DecisionOutput,
  RuleContext,
  UserProfile,
  MarketData,
  UserBehavior,
  DecisionEngineConfig,
  Insight,
  Recommendation,
} from '@/modules/decision/decision.types'
import { DECISION_RULES, getEnabledRules } from '@/modules/decision/rules'
import { generateSessionId, Logger } from '@/modules/decision/decision.utils'

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<DecisionEngineConfig> = {
  maxRulesToExecute: 20,
  executionTimeoutMs: 5000,
  enableCaching: true,
  cacheTTLSeconds: 300,
  minConfidenceThreshold: 0.5,
  logLevel: 'info',
}

/**
 * Decision Engine Class
 * Manages rule execution and decision generation
 */
export class DecisionEngine {
  private config: Required<DecisionEngineConfig>
  private logger: Logger
  private cache: Map<string, { data: DecisionOutput; expiresAt: number }> = new Map()

  constructor(config?: Partial<DecisionEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.logger = new Logger(this.config.logLevel)
  }

  /**
   * Main entry point - Execute decision engine
   * Runs all enabled rules and generates consolidated output
   */
  async runDecisionEngine(
    userProfile: UserProfile,
    marketData: MarketData[],
    userBehavior: UserBehavior
  ): Promise<DecisionOutput> {
    const startTime = Date.now()
    const sessionId = generateSessionId()

    try {
      this.logger.info('Decision engine execution started', { sessionId, userId: userProfile.id })

      // Check cache first
      const cacheKey = this.generateCacheKey(userProfile.id, marketData)
      const cachedResult = this.getCachedResult(cacheKey)
      if (cachedResult) {
        this.logger.info('Returning cached decision output', { sessionId })
        return cachedResult
      }

      // Validate inputs
      this.validateInputs(userProfile, marketData, userBehavior)

      // Build rule execution context
      const context: RuleContext = {
        userProfile,
        marketData,
        userBehavior,
        executionTimestamp: new Date(),
      }

      // Get enabled rules and limit execution
      const rulesToExecute = getEnabledRules().slice(0, this.config.maxRulesToExecute)

      // Execute all rules with timeout
      const { insights, recommendations, rulesTrigger } = await this.executeRules(
        rulesToExecute,
        context
      )

      // Filter by confidence threshold
      const filteredInsights = this.filterByConfidence(insights)
      const filteredRecommendations = this.filterByConfidence(recommendations)

      // Build output
      const executionTime = Date.now() - startTime
      const output: DecisionOutput = {
        userId: userProfile.id,
        timestamp: new Date(),
        sessionId,
        insights: filteredInsights,
        recommendations: filteredRecommendations,
        summary: this.generateSummary(filteredInsights, filteredRecommendations),
        executionTime,
        rulesExecuted: rulesToExecute.length,
        rulesTrigger,
      }

      // Cache result if caching is enabled
      if (this.config.enableCaching) {
        this.cacheResult(cacheKey, output)
      }

      this.logger.info('Decision engine execution completed', {
        sessionId,
        executionTime,
        insightsCount: filteredInsights.length,
        recommendationsCount: filteredRecommendations.length,
      })

      return output
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.error('Decision engine execution failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      })

      // Return error output
      return {
        userId: userProfile.id,
        timestamp: new Date(),
        sessionId,
        insights: [],
        recommendations: [],
        summary: 'Decision engine encountered an error during execution',
        executionTime,
        rulesExecuted: 0,
        rulesTrigger: [],
      }
    }
  }

  /**
   * Execute rules with timeout protection
   */
  private async executeRules(
    rules: typeof DECISION_RULES,
    context: RuleContext
  ): Promise<{
    insights: Insight[]
    recommendations: Recommendation[]
    rulesTrigger: string[]
  }> {
    const insights: Insight[] = []
    const recommendations: Recommendation[] = []
    const rulesTrigger: string[] = []

    const timeoutPromise = new Promise<{ error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ error: 'Execution timeout' })
      }, this.config.executionTimeoutMs)
    })

    for (const rule of rules) {
      try {
        // Check if rule condition is met
        const conditionMet = rule.condition(context)

        if (conditionMet) {
          this.logger.debug('Rule condition met', { ruleId: rule.id })

          // Execute action with timeout
          const actionPromise = Promise.resolve(rule.action(context))
          const result = await Promise.race([actionPromise, timeoutPromise])

          if ('error' in result) {
            this.logger.warn('Rule execution timeout', { ruleId: rule.id })
            continue
          }

          insights.push(...result.insights)
          recommendations.push(...result.recommendations)
          rulesTrigger.push(rule.id)

          this.logger.info('Rule executed successfully', {
            ruleId: rule.id,
            insightsGenerated: result.insights.length,
            recommendationsGenerated: result.recommendations.length,
          })
        }
      } catch (error) {
        this.logger.warn('Rule execution error', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return { insights, recommendations, rulesTrigger }
  }

  /**
   * Validate input data
   */
  private validateInputs(
    userProfile: UserProfile,
    marketData: MarketData[],
    userBehavior: UserBehavior
  ): void {
    if (!userProfile || !userProfile.id) {
      throw new Error('Invalid user profile: missing id')
    }

    if (!Array.isArray(marketData) || marketData.length === 0) {
      throw new Error('Invalid market data: must be non-empty array')
    }

    if (!userBehavior || !userBehavior.userId) {
      throw new Error('Invalid user behavior: missing userId')
    }

    // Validate market data items
    marketData.forEach((market, index) => {
      if (!market.commodityId || !market.commodityName) {
        throw new Error(`Invalid market data at index ${index}: missing commodity info`)
      }
    })
  }

  /**
   * Filter insights/recommendations by confidence threshold
   */
  private filterByConfidence<T extends Insight | Recommendation>(items: T[]): T[] {
    return items.filter((item) => item.confidence >= this.config.minConfidenceThreshold)
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(insights: Insight[], recommendations: Recommendation[]): string {
    if (insights.length === 0 && recommendations.length === 0) {
      return 'No significant insights or recommendations at this time'
    }

    const insightSummary =
      insights.length > 0
        ? `${insights.length} market insight${insights.length > 1 ? 's' : ''} generated`
        : 'No insights'

    const recommendationSummary =
      recommendations.length > 0
        ? `${recommendations.length} recommendation${recommendations.length > 1 ? 's' : ''} provided`
        : 'No recommendations'

    return `${insightSummary}. ${recommendationSummary}.`
  }

  /**
   * Cache management - Generate cache key
   */
  private generateCacheKey(userId: string, marketData: MarketData[]): string {
    const commodityIds = marketData.map((m) => m.commodityId).sort().join('|')
    return `${userId}:${commodityIds}`
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult(key: string): DecisionOutput | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Store result in cache
   */
  private cacheResult(key: string, data: DecisionOutput): void {
    const expiresAt = Date.now() + this.config.cacheTTLSeconds * 1000
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Clear all cached results
   */
  public clearCache(): void {
    this.cache.clear()
    this.logger.info('Cache cleared')
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<DecisionEngineConfig>): void {
    this.config = { ...this.config, ...config }
    this.logger.info('Configuration updated', { config: this.config })
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<DecisionEngineConfig> {
    return { ...this.config }
  }
}

/**
 * Singleton instance for application-wide use
 */
let engineInstance: DecisionEngine | null = null

/**
 * Get or create singleton instance
 */
export function getDecisionEngine(config?: Partial<DecisionEngineConfig>): DecisionEngine {
  if (!engineInstance) {
    engineInstance = new DecisionEngine(config)
  }
  return engineInstance
}

/**
 * Reset singleton (useful for testing)
 */
export function resetDecisionEngine(): void {
  engineInstance = null
}



