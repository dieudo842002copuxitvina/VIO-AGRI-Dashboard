/**
 * Recommendation System Engine
 * Data-driven recommendation generation with scoring system
 * 
 * Designed for:
 * - Product recommendations (IoT, fertilizer, equipment)
 * - Action recommendations (sell, hold, buy, diversify)
 * - Affiliate recommendations (future)
 * 
 * ML-ready architecture for future enhancement
 */

import {
  Recommendation,
  RecommendationContext,
  RecommendationOutput,
  RecommendationFilter,
  RecommendationEngineConfig,
  ProductRecommendation,
  ActionRecommendation,
  Product,
  ScoringComponent,
  UserInterestProfile,
  MarketTrendScore,
  ClimateRiskAssessment,
  ProductCategory,
  RecommendationAction as ActionType,
} from '@/modules/recommendation/recommendation.types'
import { Logger } from '@/modules/decision/decision.utils'
import {
  DEFAULT_RECOMMENDATION_WEIGHTS,
  generateRecommendations as generateScoredRecommendations,
} from '@/modules/recommendation/recommendation.scoring'

/**
 * Sample product catalog (would be fetched from database in production)
 */
const PRODUCT_CATALOG: Product[] = [
  {
    id: 'iot_001',
    name: 'Soil Moisture Sensor Pro',
    category: 'iot_sensor',
    price: 250000,
    description: 'Real-time soil moisture monitoring for optimal irrigation',
    target_crops: ['rice', 'corn', 'vegetables'],
    target_regions: ['Mekong Delta', 'Red River Delta'],
    features: {
      wireless_range: '500m',
      battery_life: '12_months',
      accuracy: 'Â±3%',
    },
    rating: 4.8,
  },
  {
    id: 'iot_002',
    name: 'Weather Station IoT',
    category: 'iot_sensor',
    price: 450000,
    description: 'Complete weather monitoring with pest forecasting',
    target_crops: ['rice', 'corn', 'coffee'],
    target_regions: ['Central Highlands', 'Mekong Delta'],
    features: {
      sensors: ['temperature', 'humidity', 'rainfall', 'wind'],
      cloud_integration: true,
    },
    rating: 4.6,
  },
  {
    id: 'irrigation_001',
    name: 'Smart Irrigation Controller',
    category: 'irrigation_system',
    price: 1200000,
    description: 'Automated drip irrigation with real-time optimization',
    target_crops: ['vegetables', 'coffee', 'tea'],
    features: {
      automation_level: 'high',
      water_savings: '30-40%',
      compatible_with: ['soil_sensors', 'weather_stations'],
    },
    rating: 4.7,
  },
  {
    id: 'fertilizer_001',
    name: 'Organic Nitrogen Blend',
    category: 'fertilizer',
    price: 180000,
    description: 'Sustainable nitrogen source for rice and corn',
    target_crops: ['rice', 'corn'],
    features: {
      organic_certified: true,
      npk_ratio: '15-0-0',
      release_time: 'slow_release',
    },
    rating: 4.5,
  },
  {
    id: 'fertilizer_002',
    name: 'Potassium Supplement Premium',
    category: 'fertilizer',
    price: 220000,
    description: 'Enhanced potassium for fruit and vegetable crops',
    target_crops: ['vegetables', 'fruits', 'coconut'],
    features: {
      solubility: 'high',
      purity: '99%',
      application: 'foliar_or_soil',
    },
    rating: 4.6,
  },
]

/**
 * Recommendation Engine Class
 */
export class RecommendationEngine {
  private config: Required<RecommendationEngineConfig>
  private logger: Logger
  private interestProfiles: Map<string, UserInterestProfile> = new Map()

  private static readonly DEFAULT_CONFIG: Required<RecommendationEngineConfig> = {
    enableProductRecommendations: true,
    enableActionRecommendations: true,
    enableAffiliateRecommendations: false,
    minScoreThreshold: 40,
    maxRecommendations: 10,
    cacheTTLSeconds: 3600,
    logLevel: 'info',
    scoringModel: {
      version: '1.0',
      type: 'rule-based',
      weights: {
        interest_match: 0.3,
        market_trend: 0.35,
        climate_risk: 0.2,
        user_quality: 0.15,
      },
      thresholds: {
        high_recommendation: 75,
        medium_recommendation: 50,
        low_recommendation: 30,
      },
    },
  }

  constructor(config?: Partial<RecommendationEngineConfig>) {
    this.config = { ...RecommendationEngine.DEFAULT_CONFIG, ...config }
    this.logger = new Logger(this.config.logLevel)
  }

  /**
   * Main entry point - Generate recommendations for user
   */
  async generateRecommendations(
    context: RecommendationContext,
    filter?: RecommendationFilter
  ): Promise<RecommendationOutput> {
    const startTime = Date.now()

    try {
      this.logger.info('Generating recommendations', {
        userId: context.userProfile.id,
      })

      // Load user interest profile (would fetch from database in production)
      const interestProfile = this.getUserInterestProfile(context.userProfile)

      // Analyze market trends
      const marketTrends = this.analyzeMarketTrends(context.marketData)

      // Assess climate risks
      const climateRisk = this.assessClimateRisk(context.userProfile, context.climateRisk)

      // Generate recommendations
      const recommendations: Recommendation[] = []

      if (this.config.enableProductRecommendations) {
        const productRecs = await this.recommendProducts(
          context,
          interestProfile,
          marketTrends,
          climateRisk
        )
        recommendations.push(...productRecs)
      }

      if (this.config.enableActionRecommendations) {
        const actionRecs = this.recommendActions(
          context,
          interestProfile,
          marketTrends,
          climateRisk
        )
        recommendations.push(...actionRecs)
      }

      // Filter and sort recommendations
      const filtered = this.filterRecommendations(
        recommendations,
        filter || {}
      )

      const sorted = filtered.sort((a, b) => b.score - a.score)
      const limited = sorted.slice(0, this.config.maxRecommendations)

      const executionTime = Date.now() - startTime

      const output: RecommendationOutput = {
        userId: context.userProfile.id,
        timestamp: new Date(),
        recommendations: limited,
        summary: this.generateSummary(limited),
        executionTime,
        context: {
          totalScored: recommendations.length,
          topRecommendations: limited.length,
        },
      }

      this.logger.info('Recommendations generated successfully', {
        userId: context.userProfile.id,
        count: limited.length,
        executionTime,
      })

      return output
    } catch (error) {
      this.logger.error('Error generating recommendations', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        userId: context.userProfile.id,
        timestamp: new Date(),
        recommendations: [],
        summary: 'Error generating recommendations',
        executionTime: Date.now() - startTime,
        context: {
          totalScored: 0,
          topRecommendations: 0,
        },
      }
    }
  }

  /**
   * Recommend products based on user profile and market data
   */
  private async recommendProducts(
    context: RecommendationContext,
    interests: UserInterestProfile,
    trends: MarketTrendScore[],
    climate: ClimateRiskAssessment
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = []

    for (const product of PRODUCT_CATALOG) {
      // Check if product matches user's interested categories
      if (!interests.interested_categories.includes(product.category)) {
        continue
      }

      // Calculate score components
      const components = this.calculateProductScore(
        product,
        context,
        interests,
        trends,
        climate
      )

      const totalScore = this.calculateWeightedScore(components)

      // Only include if above threshold
      if (totalScore < this.config.minScoreThreshold) {
        continue
      }

      const recommendation: ProductRecommendation = {
        id: `prod_rec_${product.id}_${Date.now()}`,
        type: 'product',
        title: product.name,
        description: product.description,
        product,
        score: totalScore,
        confidence: this.calculateConfidence(components),
        reasons: this.generateReasons(components),
        scoringBreakdown: components,
        priority: this.determinePriority(totalScore, components),
        estimatedBenefit: this.estimateProductBenefit(product, context),
        roi_estimate: this.estimateROI(product, context.userBehavior),
        metadata: {
          product_id: product.id,
          category: product.category,
          market_aligned: this.isMarketAligned(product, trends),
        },
      }

      recommendations.push(recommendation)
    }

    return recommendations
  }

  /**
   * Recommend actions (sell, hold, buy, etc.)
   */
  private recommendActions(
    context: RecommendationContext,
    _interests: UserInterestProfile,
    _trends: MarketTrendScore[],
    climate: ClimateRiskAssessment
  ): ActionRecommendation[] {
    const scoredRecommendations = generateScoredRecommendations(
      {
        userId: context.userProfile.id,
        interests: context.userProfile.cropTypes,
        region: context.userProfile.region,
        qualityScore: context.userBehavior.qualityScore,
        completionRate: context.userBehavior.completionRate,
      },
      context.marketData.map((market) => ({
        commodity: market.commodityName,
        commodityId: market.commodityId,
        price: market.currentPrice,
        trend: market.trendDirection,
        region: context.userProfile.region,
        demandLevel: market.demandLevel,
        supplyLevel: market.supplyLevel,
        volatilityIndex: market.volatilityIndex,
      })),
      {
        risk_level: climate.riskLevel,
        region: climate.region,
      },
      this.config.scoringModel?.weights || DEFAULT_RECOMMENDATION_WEIGHTS
    )

    return scoredRecommendations
      .filter((recommendation) => recommendation.score >= this.config.minScoreThreshold)
      .map((recommendation) => {
        const market = context.marketData.find(
          (item) =>
            item.commodityId === recommendation.commodityId ||
            item.commodityName.toLowerCase() === recommendation.commodity.toLowerCase()
        )

        const action: ActionType =
          recommendation.action === 'SELL'
            ? 'sell_now'
            : recommendation.action === 'BUY'
              ? 'buy'
              : 'hold'

        const volatilityIndex =
          typeof market?.volatilityIndex === 'number' ? market.volatilityIndex : 50

        const riskLevel: 'low' | 'medium' | 'high' =
          climate.riskLevel === 'critical' ||
          climate.riskLevel === 'high' ||
          volatilityIndex > 70
            ? 'high'
            : climate.riskLevel === 'moderate' ||
                climate.riskLevel === 'medium' ||
                volatilityIndex > 45
              ? 'medium'
              : 'low'

        const marketSnapshot =
          market ||
          {
            commodityId: recommendation.commodityId || recommendation.commodity.toLowerCase(),
            commodityName: recommendation.commodity,
            currentPrice: 0,
            priceUnit: '',
            priceChange24h: 0,
            priceChangePercentage24h: 0,
            demandLevel: 'medium' as const,
            supplyLevel: 'medium' as const,
            volatilityIndex,
            seasonalityScore: 0,
            trendDirection:
              recommendation.action === 'SELL'
                ? 'uptrend'
                : recommendation.action === 'BUY'
                  ? 'downtrend'
                  : 'sideways',
            timestamp: new Date(),
          }

        return {
          id: `action_rec_${marketSnapshot.commodityId}_${Date.now()}_${Math.round(recommendation.score)}`,
          type: 'action',
          title: `${recommendation.action}: ${recommendation.commodity}`,
          description: this.generateActionDescription(marketSnapshot, action),
          action,
          commodity_id: marketSnapshot.commodityId,
          commodity_name: marketSnapshot.commodityName,
          target_price: recommendation.targetPrice ?? this.calculateTargetPrice(marketSnapshot),
          suggested_quantity: market ? this.suggestQuantity(context.userBehavior, market) : undefined,
          timeframe: this.determineTimeframe(marketSnapshot, recommendation.explainability.components),
          risk_level: riskLevel,
          score: recommendation.score,
          confidence: recommendation.confidence,
          reasons: recommendation.reasoning,
          reasoning: recommendation.reasoning,
          scoringBreakdown: recommendation.explainability.components,
          explainability: recommendation.explainability,
          priority: this.determinePriority(
            recommendation.score,
            recommendation.explainability.components
          ),
          metadata: {
            market_trend: marketSnapshot.trendDirection,
            volatility: volatilityIndex,
            demand: marketSnapshot.demandLevel,
            explainability_weights: recommendation.explainability.weights,
          },
        }
      })
  }

  /**
   * Calculate product recommendation score   */
  private calculateProductScore(
    product: Product,
    context: RecommendationContext,
    interests: UserInterestProfile,
    trends: MarketTrendScore[],
    climate: ClimateRiskAssessment
  ): ScoringComponent[] {
    const components: ScoringComponent[] = []

    // Interest match (30% weight)
    const interestScore = this.calculateInterestMatch(product, interests, context)
    components.push({
      name: 'interest_match',
      weight: this.config.scoringModel!.weights.interest_match,
      value: interestScore,
      reasoning: [
        `Product category: ${product.category}`,
        `Matches user interests: ${interests.interested_categories.includes(product.category)}`,
        `Target crops: ${product.target_crops?.join(', ') || 'N/A'}`,
      ],
    })

    // Market trend (35% weight)
    const trendScore = this.calculateMarketTrendScore(product, context, trends)
    components.push({
      name: 'market_trend',
      weight: this.config.scoringModel!.weights.market_trend,
      value: trendScore,
      reasoning: [
        `Market condition: strong demand for IoT and fertilizers`,
        `Product rating: ${product.rating}/5`,
        `Target market regions match user location`,
      ],
    })

    // Climate risk mitigation (25% weight)
    const climateScore = this.calculateClimateRiskMitigation(product, climate)
    components.push({
      name: 'climate_risk',
      weight: this.config.scoringModel!.weights.climate_risk,
      value: climateScore,
      reasoning: [
        `Climate risk level: ${climate.riskLevel}`,
        `Product helps mitigate risks in region`,
        `Affected crops: ${climate.affectedCrops.join(', ')}`,
      ],
    })

    // User quality (10% weight)
    const qualityScore = this.calculateUserQualityScore(context.userBehavior)
    components.push({
      name: 'user_quality',
      weight: this.config.scoringModel!.weights.user_quality,
      value: qualityScore,
      reasoning: [
        `User quality score: ${context.userBehavior.qualityScore}/100`,
        `Completion rate: ${(context.userBehavior.completionRate * 100).toFixed(0)}%`,
        `Budget available for investment`,
      ],
    })

    return components
  }

  /**
   * Calculate action recommendation score
   */
  private calculateActionScore(
    market: any,
    context: RecommendationContext,
    interests: UserInterestProfile,
    climate: ClimateRiskAssessment
  ): ScoringComponent[] {
    const components: ScoringComponent[] = []

    // Interest match
    const interestScore = interests.interested_actions.length > 0 ? 75 : 50
    components.push({
      name: 'interest_match',
      weight: this.config.scoringModel!.weights.interest_match,
      value: interestScore,
      reasoning: [
        `User has action interests: ${interests.interested_actions.join(', ')}`,
      ],
    })

    // Market trend
    const trendScore = market.trendDirection === 'uptrend' ? 80 : market.trendDirection === 'downtrend' ? 40 : 60
    components.push({
      name: 'market_trend',
      weight: this.config.scoringModel!.weights.market_trend,
      value: trendScore,
      reasoning: [
        `Trend: ${market.trendDirection}`,
        `Volatility: ${market.volatilityIndex}%`,
        `Demand: ${market.demandLevel}`,
      ],
    })

    // Climate risk
    const climateScore = climate.riskLevel === 'critical' ? 90 : climate.riskLevel === 'high' ? 70 : 50
    components.push({
      name: 'climate_risk',
      weight: this.config.scoringModel!.weights.climate_risk,
      value: climateScore,
      reasoning: [
        `Climate risk: ${climate.riskLevel}`,
        `Action urgency: ${climate.urgency}%`,
      ],
    })

    // User quality
    const qualityScore = context.userBehavior.qualityScore
    components.push({
      name: 'user_quality',
      weight: this.config.scoringModel!.weights.user_quality,
      value: qualityScore,
      reasoning: [`User quality: ${qualityScore}/100`],
    })

    return components
  }

  /**
   * Calculate weighted score from components
   */
  private calculateWeightedScore(components: ScoringComponent[]): number {
    const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0) || 1
    const weightedScore =
      components.reduce((sum, comp) => sum + comp.value * comp.weight, 0) / totalWeight

    return Math.round(Math.min(100, Math.max(0, weightedScore)))
  }

  /**
   * Calculate confidence based on component quality
   */
  private calculateConfidence(components: ScoringComponent[]): number {
    const avgValue = components.reduce((sum, c) => sum + c.value, 0) / components.length
    return Math.min(1, avgValue / 100)
  }

  /**
   * Generate human-readable reasons
   */
  private generateReasons(components: ScoringComponent[]): string[] {
    return components.flatMap((c) => c.reasoning)
  }

  /**
   * Determine priority level
   */
  private determinePriority(
    score: number,
    components: ScoringComponent[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 85) return 'critical'
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  /**
   * Estimate product benefit
   */
  private estimateProductBenefit(product: Product, context: RecommendationContext): string {
    switch (product.category) {
      case 'iot_sensor':
        return 'Real-time monitoring reduces water waste by 20-30% and improves crop yield'
      case 'irrigation_system':
        return 'Automated irrigation saves up to 40% water while optimizing plant growth'
      case 'fertilizer':
        return 'Nutrient optimization improves crop health and increases yield by 15-25%'
      default:
        return 'Product implementation will improve operational efficiency'
    }
  }

  /**
   * Estimate ROI percentage
   */
  private estimateROI(product: Product, behavior: any): number {
    // Simplified ROI calculation - would be more complex in production
    const investmentLevel = Math.min(100, (behavior.avgOrderValue / product.price) * 100)
    const baseROI = product.category === 'iot_sensor' ? 150 : product.category === 'irrigation_system' ? 200 : 120

    return Math.round(baseROI * (investmentLevel / 50))
  }

  /**
   * Check if product aligns with market
   */
  private isMarketAligned(product: Product, trends: MarketTrendScore[]): boolean {
    // Check if product targets crops that are trending well
    if (!product.target_crops) return true

    return trends.some((t) => product.target_crops?.some((crop) => crop.toLowerCase() === t.commodityName.toLowerCase()))
  }

  /**
   * Calculate interest match score
   */
  private calculateInterestMatch(
    product: Product,
    interests: UserInterestProfile,
    context: RecommendationContext
  ): number {
    let score = 0

    // Category match
    if (interests.interested_categories.includes(product.category)) score += 40

    // Budget match
    if (product.price >= interests.budget_range.min && product.price <= interests.budget_range.max) {
      score += 30
    }

    // Crop alignment
    if (
      product.target_crops?.some((crop) =>
        context.userProfile.cropTypes.includes(crop.toLowerCase())
      )
    ) {
      score += 20
    }

    // Region alignment
    if (product.target_regions?.includes(context.userProfile.region)) {
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * Calculate market trend score
   */
  private calculateMarketTrendScore(product: Product, context: RecommendationContext, trends: MarketTrendScore[]): number {
    let score = 50 // Base score

    // Higher score for established products with good ratings
    if (product.rating) {
      score = Math.min(100, score + (product.rating / 5) * 30)
    }

    // Boost if market trends are favorable
    const favorableTrends = trends.filter(
      (t) => product.target_crops?.includes(t.commodityName.toLowerCase())
    ).length

    score += favorableTrends * 10

    return Math.min(100, score)
  }

  /**
   * Calculate climate risk mitigation score
   */
  private calculateClimateRiskMitigation(product: Product, climate: ClimateRiskAssessment): number {
    let score = 50

    // Higher score if product helps mitigate identified risks
    if (
      product.target_crops?.some((crop) => climate.affectedCrops.includes(crop))
    ) {
      score = climate.riskLevel === 'critical' ? 95 : climate.riskLevel === 'high' ? 80 : 60
    }

    return score
  }

  /**
   * Calculate user quality score (0-100)
   */
  private calculateUserQualityScore(behavior: any): number {
    const completionBonus = behavior.completionRate * 40
    const qualityScore = behavior.qualityScore * 0.4
    const accountAgeBonus = Math.min(20, behavior.accountAge / 30)

    return Math.min(100, completionBonus + qualityScore + accountAgeBonus)
  }

  /**
   * Determine action based on market conditions
   */
  private determineAction(market: any, components: ScoringComponent[]): ActionType {
    const trendComp = components.find((c) => c.name === 'market_trend')

    if (trendComp && trendComp.value >= 80) return 'sell_now'
    if (trendComp && trendComp.value <= 40) return 'buy'
    return 'hold'
  }

  /**
   * Generate action description
   */
  private generateActionDescription(market: any, action: ActionType): string {
    const descriptions: Record<ActionType, string> = {
      sell_now: `Market conditions favorable for selling ${market.commodityName}. Prices trending up with strong demand.`,
      hold: `Current market is neutral. Recommend holding position until clearer market signals emerge.`,
      buy: `Buying opportunity for ${market.commodityName}. Prices are favorable and supply is adequate.`,
      increase_production: `Market demand is high. Consider increasing production to capitalize on opportunity.`,
      diversify: `Reduce concentration risk by diversifying commodity portfolio across crops.`,
    }
    return descriptions[action]
  }

  /**
   * Assess action risk level
   */
  private assessActionRisk(market: any, components: ScoringComponent[]): 'low' | 'medium' | 'high' {
    const volatility = market.volatilityIndex
    if (volatility > 70) return 'high'
    if (volatility > 40) return 'medium'
    return 'low'
  }

  /**
   * Calculate target price for action
   */
  private calculateTargetPrice(market: any): number {
    // Simplified - in production would use more complex model
    if (market.trendDirection === 'uptrend') {
      return Math.round(market.currentPrice * 1.1) // 10% upside
    }
    if (market.trendDirection === 'downtrend') {
      return Math.round(market.currentPrice * 0.95) // 5% downside
    }
    return market.currentPrice
  }

  /**
   * Suggest order quantity
   */
  private suggestQuantity(behavior: any, market: any): number {
    const avgOrder = behavior.avgOrderValue || 5000000
    const maxQuantity = Math.floor(avgOrder / market.currentPrice)
    return maxQuantity
  }

  /**
   * Determine recommended timeframe
   */
  private determineTimeframe(market: any, components: ScoringComponent[]): string {
    const urgency = components.find((c) => c.name === 'climate_risk')?.value || 50

    if (urgency > 80) return 'within 3 days'
    if (urgency > 60) return 'within 1 week'
    if (urgency > 40) return 'within 2 weeks'
    return 'flexible'
  }

  /**
   * Analyze market trends
   */
  private analyzeMarketTrends(marketData: any[]): MarketTrendScore[] {
    return marketData.map((m) => ({
      commodityId: m.commodityId,
      commodityName: m.commodityName,
      priceDirection: m.trendDirection,
      volumeTrend: m.demandLevel === 'high' ? 'increasing' : m.demandLevel === 'low' ? 'decreasing' : 'stable',
      volatilityScore: m.volatilityIndex,
      demandScore: m.demandLevel === 'high' ? 80 : m.demandLevel === 'medium' ? 50 : 20,
      supplyScore: m.supplyLevel === 'high' ? 80 : m.supplyLevel === 'medium' ? 50 : 20,
    }))
  }

  /**
   * Assess climate risks
   */
  private assessClimateRisk(profile: any, risk: any): ClimateRiskAssessment {
    return {
      region: profile.region,
      riskLevel: risk,
      factors: [`Climate risk level: ${risk}`],
      affectedCrops: profile.cropTypes || [],
      urgency: risk === 'critical' ? 90 : risk === 'high' ? 70 : 40,
    }
  }

  /**
   * Get user interest profile (fetch from database in production)
   */
  private getUserInterestProfile(profile: any): UserInterestProfile {
    const cached = this.interestProfiles.get(profile.id)
    if (cached) return cached

    const newProfile: UserInterestProfile = {
      userId: profile.id,
      interested_categories: ['iot_sensor', 'irrigation_system', 'fertilizer'],
      interested_actions: ['sell_now', 'hold', 'buy'],
      risk_aversion: profile.riskTolerance === 'low' ? 0.8 : profile.riskTolerance === 'high' ? 0.2 : 0.5,
      budget_range: { min: 100000, max: 5000000 },
      climate_concerns: ['drought', 'flood', 'pest'],
      sustainability_importance: 0.7,
    }

    this.interestProfiles.set(profile.id, newProfile)
    return newProfile
  }

  /**
   * Filter recommendations
   */
  private filterRecommendations(
    recommendations: Recommendation[],
    filter: RecommendationFilter
  ): Recommendation[] {
    return recommendations.filter((rec) => {
      if (filter.types && !filter.types.includes(rec.type)) return false
      if (filter.minScore && rec.score < filter.minScore) return false
      if (filter.minConfidence && rec.confidence < filter.minConfidence) return false
      if (
        filter.categories &&
        rec.type === 'product' &&
        !filter.categories.includes((rec as ProductRecommendation).product.category)
      ) {
        return false
      }
      if (filter.priorityOnly && rec.priority !== 'high' && rec.priority !== 'critical') {
        return false
      }
      return true
    })
  }

  /**
   * Generate summary
   */
  private generateSummary(recommendations: Recommendation[]): string {
    if (recommendations.length === 0) return 'No recommendations available at this time'

    const productCount = recommendations.filter((r) => r.type === 'product').length
    const actionCount = recommendations.filter((r) => r.type === 'action').length
    const affiliateCount = recommendations.filter((r) => r.type === 'affiliate').length

    const parts: string[] = []
    if (productCount > 0) parts.push(`${productCount} product recommendation${productCount > 1 ? 's' : ''}`)
    if (actionCount > 0) parts.push(`${actionCount} action recommendation${actionCount > 1 ? 's' : ''}`)
    if (affiliateCount > 0) parts.push(`${affiliateCount} affiliate link${affiliateCount > 1 ? 's' : ''}`)

    return `Generated ${parts.join(', ')}`
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RecommendationEngineConfig>): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine(config)
    }
    return RecommendationEngine.instance
  }

  private static instance: RecommendationEngine
}

export function getRecommendationEngine(config?: Partial<RecommendationEngineConfig>): RecommendationEngine {
  return RecommendationEngine.getInstance(config)
}




