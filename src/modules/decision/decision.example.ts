/**
 * Example Usage - Decision Engine Integration
 * Shows how to use the Decision Engine in your application
 * 
 * This demonstrates:
 * 1. Creating sample data
 * 2. Initializing the decision engine
 * 3. Running decision analysis
 * 4. Processing results
 */

import {
  UserProfile,
  MarketData,
  UserBehavior,
} from '@/modules/decision/decision.types'
import { DecisionEngine } from '@/modules/decision/decision.engine'

/**
 * Example: Create sample user profile
 */
function createSampleUserProfile(): UserProfile {
  return {
    id: 'user_123',
    email: 'farmer@example.com',
    region: 'Mekong Delta',
    farmSize: 50,
    cropTypes: ['rice', 'corn', 'vegetables'],
    experienceLevel: 'advanced',
    preferredCommunicationChannel: 'email',
    createdAt: new Date('2024-01-15'),
    lastActiveAt: new Date(),
    riskTolerance: 'medium',
  }
}

/**
 * Example: Create sample market data
 */
function createSampleMarketData(): MarketData[] {
  return [
    {
      timestamp: new Date(),
      commodityId: 'rice_001',
      commodityName: 'Rice (Premium)',
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
    {
      timestamp: new Date(),
      commodityId: 'veg_001',
      commodityName: 'Vegetables (Mixed)',
      currentPrice: 8000,
      priceUnit: 'VND/kg',
      priceChange24h: 0.5,
      priceChangePercentage24h: 0.5,
      demandLevel: 'high',
      supplyLevel: 'low',
      volatilityIndex: 55,
      seasonalityScore: -40,
      trendDirection: 'sideways',
    },
  ]
}

/**
 * Example: Create sample user behavior
 */
function createSampleUserBehavior(): UserBehavior {
  return {
    userId: 'user_123',
    listingsCreated: 25,
    listingsActive: 8,
    listingsClosed: 17,
    avgResponseTime: 45,
    completionRate: 0.96,
    cancelationRate: 0.02,
    avgOrderValue: 15000000,
    totalTransactionValue: 375000000,
    tradingFrequency: 'high',
    accountAge: 450,
    lastTransactionDays: 2,
    qualityScore: 92,
  }
}

/**
 * Main execution example
 */
async function demonstrateDecisionEngine(): Promise<void> {
  console.log('=== Decision Engine Demonstration ===\n')

  try {
    // 1. Create decision engine instance
    const engine = new DecisionEngine({
      logLevel: 'info',
      minConfidenceThreshold: 0.5,
      enableCaching: true,
      cacheTTLSeconds: 300,
      executionTimeoutMs: 5000,
    })

    // 2. Prepare input data
    const userProfile = createSampleUserProfile()
    const marketData = createSampleMarketData()
    const userBehavior = createSampleUserBehavior()

    console.log('ðŸ“Š Input Data:')
    console.log(`  User: ${userProfile.email}`)
    console.log(`  Region: ${userProfile.region}`)
    console.log(`  Commodities: ${marketData.map((m) => m.commodityName).join(', ')}`)
    console.log()

    // 3. Run decision engine
    console.log('ðŸ”„ Running decision engine...\n')
    const result = await engine.runDecisionEngine(
      userProfile,
      marketData,
      userBehavior
    )

    // 4. Display results
    console.log('âœ… Decision Engine Results:\n')

    console.log(`Session ID: ${result.sessionId}`)
    console.log(`Execution Time: ${result.executionTime}ms`)
    console.log(`Rules Executed: ${result.rulesExecuted}`)
    console.log(`Rules Triggered: ${result.rulesTrigger.join(', ')}\n`)

    // Display insights
    console.log(`ðŸ“ˆ Insights (${result.insights.length}):`)
    result.insights.forEach((insight, index) => {
      console.log(`
  ${index + 1}. ${insight.title}
     Category: ${insight.category}
     Confidence: ${(insight.confidence * 100).toFixed(0)}%
     Description: ${insight.description}`)
    })

    // Display recommendations
    console.log(`\nðŸ’¡ Recommendations (${result.recommendations.length}):`)
    result.recommendations.forEach((rec, index) => {
      console.log(`
  ${index + 1}. ${rec.title}
     Type: ${rec.type}
     Priority: ${rec.priority}
     Confidence: ${(rec.confidence * 100).toFixed(0)}%
     Action: ${rec.suggestedAction}
     Impact: ${rec.expectedImpact}`)
    })

    // Display summary
    console.log(`\nðŸ“‹ Summary:`)
    console.log(`  ${result.summary}`)

    // 5. Show cache statistics
    const cacheStats = engine.getCacheStats()
    console.log(`\nðŸ’¾ Cache Stats:`)
    console.log(`  Size: ${cacheStats.size}`)
    console.log(`  Keys: ${cacheStats.keys.join(', ') || 'None'}`)

    // 6. Demonstrate caching (second call)
    console.log(`\nðŸ”„ Running decision engine again (should use cache)...`)
    const cachedResult = await engine.runDecisionEngine(
      userProfile,
      marketData,
      userBehavior
    )
    console.log(`  Cached result execution time: ${cachedResult.executionTime}ms (faster)`)

  } catch (error) {
    console.error('âŒ Error:', error instanceof Error ? error.message : error)
  }
}

/**
 * Example: Direct rule evaluation
 */
function demonstrateRuleEvaluation(): void {
  console.log('\n=== Rule Evaluation Example ===\n')

  const { DECISION_RULES } = require('@/modules/decision/rules')

  console.log('Available Rules:')
  DECISION_RULES.forEach(
    (rule: any, index: number) => {
      console.log(`
  ${index + 1}. ${rule.name} (ID: ${rule.id})
     Description: ${rule.description}
     Priority: ${rule.priority}
     Enabled: ${rule.enabled}
     Tags: ${rule.tags.join(', ')}
     Risk Level: ${rule.riskLevel}`)
    }
  )
}

/**
 * Example: Using the API endpoint
 */
async function demonstrateAPIUsage(): Promise<void> {
  console.log('\n=== API Usage Example ===\n')

  const userProfile = createSampleUserProfile()
  const marketData = createSampleMarketData()
  const userBehavior = createSampleUserBehavior()

  const payload = {
    userProfile,
    marketData,
    userBehavior,
  }

  console.log('POST /api/decision/analyze')
  console.log('Request body:')
  console.log(JSON.stringify(payload, null, 2))

  console.log('\nExample Response:')
  console.log(JSON.stringify(
    {
      userId: 'user_123',
      timestamp: new Date().toISOString(),
      sessionId: 'session_...',
      insights: [{ id: 'insight_...', category: 'opportunity', title: '...' }],
      recommendations: [{ id: 'rec_...', type: 'opportunity', title: '...' }],
      summary: '...',
      executionTime: 123,
      rulesExecuted: 5,
      rulesTrigger: ['rule-1', 'rule-2'],
    },
    null,
    2
  ))
}

/**
 * Run demonstrations
 */
export async function runDemonstrations(): Promise<void> {
  await demonstrateDecisionEngine()
  demonstrateRuleEvaluation()
  await demonstrateAPIUsage()
}

// Uncomment to run demonstrations
// runDemonstrations().catch(console.error)


