/**
 * Recommendation System - Usage Examples
 * Demonstrates how to use the Recommendation Engine with real data
 */

import { getRecommendationEngine } from '@/modules/recommendation/recommendation.engine'
import {
  RecommendationContext,
  RecommendationFilter,
} from '@/modules/recommendation/recommendation.types'
import {
  UserProfile,
  MarketData,
  UserBehavior,
} from '@/modules/decision/decision.types'

/**
 * Example 1: Basic recommendation generation
 */
export async function example1_basicRecommendations(): Promise<void> {
  console.log('=== Example 1: Basic Recommendations ===\n')

  // Sample user profile
  const userProfile: UserProfile = {
    id: 'user_456',
    email: 'farmer@example.com',
    region: 'Mekong Delta',
    farmSize: 50,
    cropTypes: ['rice', 'corn', 'vegetables'],
    experienceLevel: 'advanced',
    preferredCommunicationChannel: 'email',
    createdAt: new Date('2023-01-15'),
    lastActiveAt: new Date(),
    riskTolerance: 'medium',
  }

  // Sample user behavior
  const userBehavior: UserBehavior = {
    userId: 'user_456',
    listingsCreated: 45,
    listingsActive: 12,
    listingsClosed: 33,
    avgResponseTime: 30,
    completionRate: 0.94,
    cancelationRate: 0.02,
    avgOrderValue: 8500000,
    totalTransactionValue: 382500000,
    tradingFrequency: 'high',
    accountAge: 550,
    lastTransactionDays: 1,
    qualityScore: 88,
  }

  // Sample market data
  const marketData: MarketData[] = [
    {
      timestamp: new Date(),
      commodityId: 'rice_001',
      commodityName: 'Rice',
      currentPrice: 45000,
      priceUnit: 'VND/kg',
      priceChange24h: 2.5,
      priceChangePercentage24h: 2.5,
      demandLevel: 'high',
      supplyLevel: 'medium',
      volatilityIndex: 22,
      seasonalityScore: 65,
      trendDirection: 'uptrend',
    },
    {
      timestamp: new Date(),
      commodityId: 'corn_001',
      commodityName: 'Corn',
      currentPrice: 12000,
      priceUnit: 'VND/kg',
      priceChange24h: -1.2,
      priceChangePercentage24h: -1.2,
      demandLevel: 'medium',
      supplyLevel: 'high',
      volatilityIndex: 35,
      seasonalityScore: 20,
      trendDirection: 'downtrend',
    },
  ]

  // Create recommendation context
  const context: RecommendationContext = {
    userProfile,
    userBehavior,
    marketData,
    climateRisk: 'moderate',
    executionTimestamp: new Date(),
  }

  // Generate recommendations
  const engine = getRecommendationEngine()
  const result = await engine.generateRecommendations(context)

  console.log(`Generated ${result.recommendations.length} recommendations\n`)
  result.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.title}`)
    console.log(`   Type: ${rec.type}`)
    console.log(`   Score: ${rec.score}/100`)
    console.log(`   Confidence: ${(rec.confidence * 100).toFixed(0)}%`)
    console.log(`   Priority: ${rec.priority}`)
    console.log()
  })

  console.log(`Summary: ${result.summary}`)
  console.log(`Execution Time: ${result.executionTime}ms\n`)
}

/**
 * Example 2: Filtered recommendations
 */
export async function example2_filteredRecommendations(): Promise<void> {
  console.log('=== Example 2: Filtered Recommendations (Products Only) ===\n')

  const userProfile: UserProfile = {
    id: 'user_789',
    email: 'agritech@example.com',
    region: 'Central Highlands',
    farmSize: 100,
    cropTypes: ['coffee', 'avocado', 'cardamom'],
    experienceLevel: 'intermediate',
    preferredCommunicationChannel: 'push',
    createdAt: new Date('2022-06-20'),
    lastActiveAt: new Date(),
    riskTolerance: 'low',
  }

  const userBehavior: UserBehavior = {
    userId: 'user_789',
    listingsCreated: 20,
    listingsActive: 8,
    listingsClosed: 12,
    avgResponseTime: 60,
    completionRate: 0.85,
    cancelationRate: 0.05,
    avgOrderValue: 12000000,
    totalTransactionValue: 240000000,
    tradingFrequency: 'medium',
    accountAge: 400,
    lastTransactionDays: 5,
    qualityScore: 78,
  }

  const marketData: MarketData[] = [
    {
      timestamp: new Date(),
      commodityId: 'coffee_001',
      commodityName: 'Coffee Arabica',
      currentPrice: 95000,
      priceUnit: 'VND/kg',
      priceChange24h: 0.8,
      priceChangePercentage24h: 0.8,
      demandLevel: 'high',
      supplyLevel: 'low',
      volatilityIndex: 45,
      seasonalityScore: 30,
      trendDirection: 'sideways',
    },
  ]

  const context: RecommendationContext = {
    userProfile,
    userBehavior,
    marketData,
    climateRisk: 'high',
    executionTimestamp: new Date(),
  }

  // Filter for products only
  const filter: RecommendationFilter = {
    types: ['product'],
    minScore: 50,
  }

  const engine = getRecommendationEngine()
  const result = await engine.generateRecommendations(context, filter)

  console.log(`Generated ${result.recommendations.length} product recommendations\n`)
  result.recommendations.forEach((rec) => {
    if (rec.type === 'product') {
      const productRec = rec as any
      console.log(`ðŸ“¦ ${productRec.product.name}`)
      console.log(`   Price: ${productRec.product.price.toLocaleString('vi-VN')} VND`)
      console.log(`   Score: ${rec.score}/100 | Confidence: ${(rec.confidence * 100).toFixed(0)}%`)
      console.log(`   Benefit: ${productRec.estimatedBenefit}`)
      console.log(`   ROI Estimate: ${productRec.roi_estimate}%`)
      console.log()
    }
  })
}

/**
 * Example 3: Action recommendations only
 */
export async function example3_actionRecommendations(): Promise<void> {
  console.log('=== Example 3: Action Recommendations (Trade Signals) ===\n')

  const userProfile: UserProfile = {
    id: 'user_001',
    email: 'trader@example.com',
    region: 'Red River Delta',
    farmSize: 25,
    cropTypes: ['rice', 'vegetables'],
    experienceLevel: 'advanced',
    preferredCommunicationChannel: 'email',
    createdAt: new Date('2021-03-10'),
    lastActiveAt: new Date(),
    riskTolerance: 'high',
  }

  const userBehavior: UserBehavior = {
    userId: 'user_001',
    listingsCreated: 120,
    listingsActive: 15,
    listingsClosed: 105,
    avgResponseTime: 15,
    completionRate: 0.98,
    cancelationRate: 0.01,
    avgOrderValue: 3500000,
    totalTransactionValue: 420000000,
    tradingFrequency: 'high',
    accountAge: 800,
    lastTransactionDays: 0,
    qualityScore: 95,
  }

  const marketData: MarketData[] = [
    {
      timestamp: new Date(),
      commodityId: 'rice_premium',
      commodityName: 'Premium Rice',
      currentPrice: 48000,
      priceUnit: 'VND/kg',
      priceChange24h: 4.5,
      priceChangePercentage24h: 4.5,
      demandLevel: 'high',
      supplyLevel: 'low',
      volatilityIndex: 18,
      seasonalityScore: 75,
      trendDirection: 'uptrend',
    },
    {
      timestamp: new Date(),
      commodityId: 'vegetables_seasonal',
      commodityName: 'Seasonal Vegetables',
      currentPrice: 28000,
      priceUnit: 'VND/kg',
      priceChange24h: -3.2,
      priceChangePercentage24h: -3.2,
      demandLevel: 'low',
      supplyLevel: 'high',
      volatilityIndex: 65,
      seasonalityScore: -55,
      trendDirection: 'downtrend',
    },
  ]

  const context: RecommendationContext = {
    userProfile,
    userBehavior,
    marketData,
    climateRisk: 'low',
    executionTimestamp: new Date(),
  }

  // Filter for actions only
  const filter: RecommendationFilter = {
    types: ['action'],
    priorityOnly: true, // Only high/critical priority
  }

  const engine = getRecommendationEngine()
  const result = await engine.generateRecommendations(context, filter)

  console.log(`Generated ${result.recommendations.length} action recommendations\n`)
  result.recommendations.forEach((rec) => {
    if (rec.type === 'action') {
      const actionRec = rec as any
      console.log(`ðŸŽ¯ ${actionRec.title}`)
      console.log(`   Action: ${actionRec.action.replace(/_/g, ' ').toUpperCase()}`)
      console.log(`   Score: ${rec.score}/100 | Priority: ${rec.priority}`)
      console.log(`   Timeframe: ${actionRec.timeframe}`)
      console.log(`   Risk Level: ${actionRec.risk_level}`)
      if (actionRec.target_price) {
        console.log(`   Target Price: ${actionRec.target_price.toLocaleString('vi-VN')} VND`)
      }
      console.log()
    }
  })
}

/**
 * Example 4: Analyzing scoring breakdown
 */
export async function example4_scoringAnalysis(): Promise<void> {
  console.log('=== Example 4: Scoring Breakdown Analysis ===\n')

  const userProfile: UserProfile = {
    id: 'user_999',
    email: 'analyst@example.com',
    region: 'Mekong Delta',
    farmSize: 75,
    cropTypes: ['rice', 'fish'],
    experienceLevel: 'intermediate',
    preferredCommunicationChannel: 'email',
    createdAt: new Date('2023-09-01'),
    lastActiveAt: new Date(),
    riskTolerance: 'medium',
  }

  const userBehavior: UserBehavior = {
    userId: 'user_999',
    listingsCreated: 35,
    listingsActive: 10,
    listingsClosed: 25,
    avgResponseTime: 45,
    completionRate: 0.92,
    cancelationRate: 0.03,
    avgOrderValue: 6000000,
    totalTransactionValue: 210000000,
    tradingFrequency: 'medium',
    accountAge: 350,
    lastTransactionDays: 3,
    qualityScore: 82,
  }

  const marketData: MarketData[] = [
    {
      timestamp: new Date(),
      commodityId: 'rice_001',
      commodityName: 'Rice',
      currentPrice: 45000,
      priceUnit: 'VND/kg',
      priceChange24h: 2.5,
      priceChangePercentage24h: 2.5,
      demandLevel: 'high',
      supplyLevel: 'medium',
      volatilityIndex: 25,
      seasonalityScore: 60,
      trendDirection: 'uptrend',
    },
  ]

  const context: RecommendationContext = {
    userProfile,
    userBehavior,
    marketData,
    climateRisk: 'moderate',
    executionTimestamp: new Date(),
  }

  const engine = getRecommendationEngine()
  const result = await engine.generateRecommendations(context)

  console.log(`Recommendation: ${result.recommendations[0]?.title}\n`)

  if (result.recommendations[0]) {
    const rec = result.recommendations[0]
    console.log('Scoring Breakdown:')
    rec.scoringBreakdown.forEach((component) => {
      const weightedScore = (component.value * component.weight * 100).toFixed(1)
      console.log(`  ${component.name}: ${component.value}/100 (weight: ${(component.weight * 100).toFixed(0)}%)`)
      console.log(`    Contribution: ${weightedScore}%`)
      component.reasoning.forEach((reason) => {
        console.log(`    - ${reason}`)
      })
      console.log()
    })

    console.log(`Final Score: ${rec.score}/100`)
    console.log(`Confidence: ${(rec.confidence * 100).toFixed(0)}%`)
  }
}

/**
 * Example 5: ML-ready architecture (for future use)
 */
export async function example5_mlReadyArchitecture(): Promise<void> {
  console.log('=== Example 5: ML-Ready Architecture ===\n')

  // Initialize engine with ML scoring model (future)
  const engine = getRecommendationEngine({
    scoringModel: {
      version: '1.0-ml',
      type: 'ml-model',
      weights: {
        interest_match: 0.25,
        market_trend: 0.40, // Higher emphasis on market data
        climate_risk: 0.20,
        user_quality: 0.15,
      },
      thresholds: {
        high_recommendation: 80,
        medium_recommendation: 55,
        low_recommendation: 35,
      },
      metadata: {
        model_name: 'XGBoost_v1',
        training_data: '2024_agricultural_market',
        last_trained: '2026-03-01',
        accuracy: 0.87,
      },
    },
  })

  console.log('ML-Ready Configuration:')
  console.log('- Can switch between rule-based and ML models')
  console.log('- Scoring components are isolated and testable')
  console.log('- New features can be added without breaking existing logic')
  console.log('- All scores and reasoning are captured for ML training\n')

  console.log('Future ML Integration Path:')
  console.log('1. Collect recommendation feedback (shown, clicked, converted)')
  console.log('2. Train model on historical data')
  console.log('3. Deploy model as scoring function')
  console.log('4. Monitor performance vs. rule-based baseline')
  console.log('5. Gradually increase model usage as confidence improves\n')
}

/**
 * Example 6: Real-world scenario
 */
export async function example6_realWorldScenario(): Promise<void> {
  console.log('=== Example 6: Real-World Scenario ===\n')
  console.log('Scenario: Farmer in vulnerable region wants IoT investment advice\n')

  const farmerProfile: UserProfile = {
    id: 'farmer_duc',
    email: 'duc.nguyen@farm.vn',
    region: 'Mekong Delta',
    farmSize: 40,
    cropTypes: ['rice', 'shrimp'],
    experienceLevel: 'beginner',
    preferredCommunicationChannel: 'sms',
    createdAt: new Date('2025-01-15'),
    lastActiveAt: new Date(),
    riskTolerance: 'low',
  }

  const farmerBehavior: UserBehavior = {
    userId: 'farmer_duc',
    listingsCreated: 8,
    listingsActive: 2,
    listingsClosed: 6,
    avgResponseTime: 120,
    completionRate: 0.75,
    cancelationRate: 0.08,
    avgOrderValue: 4000000,
    totalTransactionValue: 32000000,
    tradingFrequency: 'low',
    accountAge: 60,
    lastTransactionDays: 15,
    qualityScore: 68,
  }

  const marketData: MarketData[] = [
    {
      timestamp: new Date(),
      commodityId: 'rice_001',
      commodityName: 'Rice',
      currentPrice: 43000,
      priceUnit: 'VND/kg',
      priceChange24h: 1.5,
      priceChangePercentage24h: 1.5,
      demandLevel: 'high',
      supplyLevel: 'medium',
      volatilityIndex: 28,
      seasonalityScore: 55,
      trendDirection: 'uptrend',
    },
  ]

  const context: RecommendationContext = {
    userProfile: farmerProfile,
    userBehavior: farmerBehavior,
    marketData,
    climateRisk: 'high', // Vulnerable to flooding
    executionTimestamp: new Date(),
  }

  const engine = getRecommendationEngine()
  const result = await engine.generateRecommendations(context)

  console.log('Recommendations for Farmer Duc:\n')
  result.recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.title}`)
    console.log(`   Score: ${rec.score}/100 (Priority: ${rec.priority})`)
    console.log(`   Why: ${rec.reasons[0]}`)
    console.log()
  })

  console.log(`\nAll reasons considered:`)
  if (result.recommendations[0]) {
    result.recommendations[0].reasons.forEach((reason, i) => {
      console.log(`â€¢ ${reason}`)
    })
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await example1_basicRecommendations()
  console.log('\n' + '='.repeat(60) + '\n')

  await example2_filteredRecommendations()
  console.log('\n' + '='.repeat(60) + '\n')

  await example3_actionRecommendations()
  console.log('\n' + '='.repeat(60) + '\n')

  await example4_scoringAnalysis()
  console.log('\n' + '='.repeat(60) + '\n')

  await example5_mlReadyArchitecture()
  console.log('\n' + '='.repeat(60) + '\n')

  await example6_realWorldScenario()
}

// Uncomment to run demonstrations
// runAllExamples().catch(console.error)


