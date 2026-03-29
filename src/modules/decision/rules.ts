/**
 * Business Rules for Decision Engine
 * Production-ready rule definitions with conditions and actions
 * 
 * Each rule represents a specific business logic that triggers insights/recommendations
 */

import { Rule, RuleContext, Insight, Recommendation } from '@/modules/decision/decision.types'
import { generateInsightId, generateRecommendationId } from '@/modules/decision/decision.utils'

/**
 * Rule: Detect High Price Opportunity for Sellers
 * When commodity price trend is upward and volatility is low, recommend to list now
 */
const ruleHighPriceOpportunity: Rule = {
  id: 'rule-high-price-opportunity',
  name: 'High Price Opportunity Detector',
  description: 'Identifies when market conditions favor sellers to list commodities',
  priority: 100,
  enabled: true,
  tags: ['price', 'seller', 'opportunity'],
  riskLevel: 'low',
  condition: (context: RuleContext) => {
    const uptrends = context.marketData.filter(
      (m) => m.trendDirection === 'uptrend' && m.volatilityIndex < 40
    )
    return uptrends.length > 0 && context.userProfile.riskTolerance !== 'low'
  },
  action: (context: RuleContext) => {
    const uptrends = context.marketData.filter(
      (m) => m.trendDirection === 'uptrend' && m.volatilityIndex < 40
    )

    const insights: Insight[] = uptrends.map((market) => ({
      id: generateInsightId(),
      category: 'opportunity',
      title: `Favorable Conditions for ${market.commodityName}`,
      description: `${market.commodityName} is in uptrend with low volatility (${market.volatilityIndex}). Current price: ${market.currentPrice} ${market.priceUnit}`,
      dataSource: 'market-analysis',
      confidence: Math.min(1, (100 - market.volatilityIndex) / 100),
      metadata: {
        commodity: market.commodityName,
        volatility: market.volatilityIndex,
        trend: market.trendDirection,
      },
    }))

    const recommendations: Recommendation[] = uptrends.map((market) => ({
      id: generateRecommendationId(),
      type: 'opportunity',
      title: `List ${market.commodityName} Now`,
      description: `Market conditions are favorable for selling ${market.commodityName}. Price is trending up with stable conditions.`,
      priority: 'high',
      confidence: Math.min(1, (100 - market.volatilityIndex) / 100),
      reasoning: [
        `Price trend is ${market.trendDirection}`,
        `Volatility is low at ${market.volatilityIndex}%`,
        `Demand level is ${market.demandLevel}`,
      ],
      suggestedAction: `Create a listing for ${market.commodityName} at premium pricing`,
      expectedImpact: 'Higher price realization and faster sales',
      targetAudience: 'seller',
    }))

    return { insights, recommendations }
  },
}

/**
 * Rule: Alert on Market Downturn
 * When prices drop significantly or volatility spikes, alert users to protect positions
 */
const ruleMarketDownturnAlert: Rule = {
  id: 'rule-market-downturn-alert',
  name: 'Market Downturn Alert',
  description: 'Alerts when market conditions become unstable or prices drop sharply',
  priority: 110,
  enabled: true,
  tags: ['price', 'risk', 'alert'],
  riskLevel: 'high',
  condition: (context: RuleContext) => {
    return context.marketData.some(
      (m) =>
        (m.trendDirection === 'downtrend' && Math.abs(m.priceChange24h) > 5) ||
        m.volatilityIndex > 70
    )
  },
  action: (context: RuleContext) => {
    const riskMarkets = context.marketData.filter(
      (m) =>
        (m.trendDirection === 'downtrend' && Math.abs(m.priceChange24h) > 5) ||
        m.volatilityIndex > 70
    )

    const insights: Insight[] = riskMarkets.map((market) => ({
      id: generateInsightId(),
      category: 'risk',
      title: `Market Volatility Alert for ${market.commodityName}`,
      description: `${market.commodityName} showing instability. Price change: ${market.priceChange24h.toFixed(2)}%, Volatility: ${market.volatilityIndex}%`,
      dataSource: 'risk-monitoring',
      confidence: Math.min(1, market.volatilityIndex / 100),
      metadata: {
        commodity: market.commodityName,
        priceChange: market.priceChange24h,
        volatility: market.volatilityIndex,
        trend: market.trendDirection,
      },
    }))

    const recommendations: Recommendation[] = riskMarkets.map((market) => ({
      id: generateRecommendationId(),
      type: 'alert',
      title: `Caution: ${market.commodityName} Market Alert`,
      description: `Market conditions for ${market.commodityName} are unstable. Review your positions and consider protective measures.`,
      priority: 'critical',
      confidence: 0.95,
      reasoning: [
        `Price movement exceeds threshold`,
        `Market volatility is elevated at ${market.volatilityIndex}%`,
        `Trend direction: ${market.trendDirection}`,
      ],
      suggestedAction: 'Review active listings and consider adjusting prices or taking items offline',
      expectedImpact: 'Reduced risk exposure and potential losses',
      targetAudience: 'both',
    }))

    return { insights, recommendations }
  },
}

/**
 * Rule: Seller Quality Recognition
 * When seller has high quality score and consistent behavior, recommend premium features
 */
const ruleSellerQualityRecognition: Rule = {
  id: 'rule-seller-quality-recognition',
  name: 'Seller Quality Recognition',
  description: 'Recognizes high-performing sellers and recommends premium opportunities',
  priority: 90,
  enabled: true,
  tags: ['seller', 'quality', 'opportunity'],
  riskLevel: 'low',
  condition: (context: RuleContext) => {
    return (
      context.userBehavior.qualityScore >= 85 &&
      context.userBehavior.completionRate >= 0.95 &&
      context.userBehavior.listingsActive >= 3
    )
  },
  action: (context: RuleContext) => {
    const insights: Insight[] = [
      {
        id: generateInsightId(),
        category: 'opportunity',
        title: 'Seller Quality Tier Recognition',
        description: `Congratulations! Your seller quality score (${context.userBehavior.qualityScore}/100) qualifies you for premium features.`,
        dataSource: 'seller-analytics',
        confidence: 0.98,
        metadata: {
          qualityScore: context.userBehavior.qualityScore,
          completionRate: context.userBehavior.completionRate,
          activeListings: context.userBehavior.listingsActive,
        },
      },
    ]

    const recommendations: Recommendation[] = [
      {
        id: generateRecommendationId(),
        type: 'opportunity',
        title: 'Unlock Premium Seller Features',
        description:
          'Your excellent track record unlocks access to premium seller tools and priority visibility',
        priority: 'medium',
        confidence: 0.98,
        reasoning: [
          `Quality score: ${context.userBehavior.qualityScore}/100`,
          `Completion rate: ${(context.userBehavior.completionRate * 100).toFixed(0)}%`,
          `Active listings: ${context.userBehavior.listingsActive}`,
        ],
        suggestedAction: 'Upgrade to Premium Seller account for enhanced visibility',
        expectedImpact:
          'Increased buyer inquiries and higher conversion rates for your listings',
        targetAudience: 'seller',
      },
    ]

    return { insights, recommendations }
  },
}

/**
 * Rule: Buyer Readiness Trigger
 * When buyer has high order frequency and budget, recommend premium commodities
 */
const ruleBuyerReadinessTrigger: Rule = {
  id: 'rule-buyer-readiness-trigger',
  name: 'Active Buyer Engagement',
  description: 'Identifies active buyers and suggests high-value opportunities',
  priority: 85,
  enabled: true,
  tags: ['buyer', 'engagement', 'opportunity'],
  riskLevel: 'low',
  condition: (context: RuleContext) => {
    return (
      context.userBehavior.tradingFrequency === 'high' &&
      context.userBehavior.avgOrderValue > 10000 &&
      context.userBehavior.cancelationRate < 0.05
    )
  },
  action: (context: RuleContext) => {
    const premiumMarkets = context.marketData.filter(
      (m) => m.demandLevel === 'high' && m.supplyLevel === 'low'
    )

    const insights: Insight[] = premiumMarkets.map((market) => ({
      id: generateInsightId(),
      category: 'opportunity',
      title: `High-Demand ${market.commodityName} Available`,
      description: `${market.commodityName} has limited supply and high demand. Premium opportunities available at ${market.currentPrice} ${market.priceUnit}.`,
      dataSource: 'market-matching',
      confidence: 0.9,
      metadata: {
        commodity: market.commodityName,
        demand: market.demandLevel,
        supply: market.supplyLevel,
        price: market.currentPrice,
      },
    }))

    const recommendations: Recommendation[] = premiumMarkets.map((market) => ({
      id: generateRecommendationId(),
      type: 'opportunity',
      title: `Secure ${market.commodityName} Before Stock Runs Out`,
      description: `Limited supply of ${market.commodityName} with high buyer demand. Secure your quantity now.`,
      priority: 'high',
      confidence: 0.88,
      reasoning: [
        `Supply level is ${market.supplyLevel}`,
        `Demand level is ${market.demandLevel}`,
        `Your order history shows strong purchasing pattern`,
      ],
      suggestedAction: `Place an order for ${market.commodityName} at current market rate`,
      expectedImpact: 'Secure desired quantity and build supplier relationships',
      targetAudience: 'buyer',
    }))

    return { insights, recommendations }
  },
}

/**
 * Rule: Seasonal Commodity Alert
 * When seasonal index indicates peak season, recommend action
 */
const ruleSeasonalCommodityAlert: Rule = {
  id: 'rule-seasonal-commodity-alert',
  name: 'Seasonal Commodity Insights',
  description: 'Provides insights based on seasonal patterns and optimal trading windows',
  priority: 80,
  enabled: true,
  tags: ['seasonal', 'trend', 'opportunity'],
  riskLevel: 'low',
  condition: (context: RuleContext) => {
    return context.marketData.some((m) => Math.abs(m.seasonalityScore) > 50)
  },
  action: (context: RuleContext) => {
    const seasonalMarkets = context.marketData.filter(
      (m) => Math.abs(m.seasonalityScore) > 50
    )

    const insights: Insight[] = seasonalMarkets.map((market) => {
      const isPeakSeason = market.seasonalityScore > 50
      return {
        id: generateInsightId(),
        category: 'trend',
        title: `${market.commodityName}: ${isPeakSeason ? 'Peak' : 'Low'} Season`,
        description: `${market.commodityName} is in ${isPeakSeason ? 'peak' : 'low'} season with seasonal score of ${market.seasonalityScore}. ${isPeakSeason ? 'High availability and demand expected.' : 'Limited availability expected.'}`,
        dataSource: 'seasonal-analysis',
        confidence: Math.min(1, Math.abs(market.seasonalityScore) / 100),
        metadata: {
          commodity: market.commodityName,
          seasonScore: market.seasonalityScore,
          isPeakSeason,
        },
      }
    })

    const recommendations: Recommendation[] = seasonalMarkets.map((market) => {
      const isPeakSeason = market.seasonalityScore > 50
      return {
        id: generateRecommendationId(),
        type: 'opportunity',
        title: `${isPeakSeason ? 'Capitalize on' : 'Prepare for'} ${market.commodityName} Season`,
        description: isPeakSeason
          ? `Peak season for ${market.commodityName} is here. List surplus stock or buy in bulk at favorable terms.`
          : `Prepare for upcoming ${market.commodityName} season. Stock up now at lower prices.`,
        priority: isPeakSeason ? 'high' : 'medium',
        confidence: Math.min(1, Math.abs(market.seasonalityScore) / 100),
        reasoning: [
          `Seasonal score: ${market.seasonalityScore}`,
          `Season status: ${isPeakSeason ? 'Peak' : 'Low'}`,
          `Historical patterns support this insight`,
        ],
        suggestedAction: isPeakSeason
          ? `Increase listings for ${market.commodityName}`
          : `Strategic purchasing opportunity for ${market.commodityName}`,
        expectedImpact: isPeakSeason
          ? 'Maximize revenue during high-demand period'
          : 'Reduce procurement costs for upcoming season',
        targetAudience: isPeakSeason ? 'seller' : 'buyer',
      }
    })

    return { insights, recommendations }
  },
}

/**
 * Export all rules ordered by priority (higher priority first)
 */
export const DECISION_RULES: Rule[] = [
  ruleMarketDownturnAlert,
  ruleHighPriceOpportunity,
  ruleSellerQualityRecognition,
  ruleBuyerReadinessTrigger,
  ruleSeasonalCommodityAlert,
].sort((a, b) => b.priority - a.priority)

/**
 * Get rule by ID for testing/debugging
 */
export function getRuleById(ruleId: string): Rule | undefined {
  return DECISION_RULES.find((rule) => rule.id === ruleId)
}

/**
 * Get enabled rules
 */
export function getEnabledRules(): Rule[] {
  return DECISION_RULES.filter((rule) => rule.enabled)
}

/**
 * Filter rules by tag
 */
export function getRulesByTag(tag: string): Rule[] {
  return DECISION_RULES.filter((rule) => rule.tags.includes(tag))
}

