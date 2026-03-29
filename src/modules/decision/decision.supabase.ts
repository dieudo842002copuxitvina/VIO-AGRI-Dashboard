/**
 * Decision Engine Integration with Supabase
 *
 * Shows how to integrate the Decision Engine with Supabase to:
 * 1. Fetch user profile from database
 * 2. Fetch real market data
 * 3. Calculate user behavior metrics
 * 4. Run decision engine
 * 5. Store results
 */

import { supabase } from '@/lib/supabase/client'
import { DecisionEngine } from '@/modules/decision/decision.engine'
import {
  UserProfile,
  MarketData,
  UserBehavior,
  DecisionOutput,
} from '@/modules/decision/decision.types'

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        region,
        farm_size,
        crop_types,
        experience_level,
        preferred_communication_channel,
        created_at,
        last_active_at,
        risk_tolerance
      `
      )
      .eq('id', userId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      email: data.email,
      region: data.region,
      farmSize: data.farm_size,
      cropTypes: data.crop_types || [],
      experienceLevel: data.experience_level,
      preferredCommunicationChannel: data.preferred_communication_channel,
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.last_active_at),
      riskTolerance: data.risk_tolerance,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export async function fetchMarketData(): Promise<MarketData[]> {
  try {
    const { data, error } = await supabase
      .from('market_data')
      .select(
        `
        timestamp,
        commodity_id,
        commodity:commodities(name),
        current_price,
        price_unit,
        price_change_24h,
        demand_level,
        supply_level,
        volatility_index,
        seasonality_score,
        trend_direction
      `
      )
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) throw error

    return (data ?? []).map((market: any) => {
      const commodity = Array.isArray(market.commodity)
        ? market.commodity[0]
        : market.commodity

      return {
        timestamp: new Date(market.timestamp),
        commodityId: market.commodity_id,
        commodityName: commodity?.name ?? '',
        currentPrice: market.current_price,
        priceUnit: market.price_unit,
        priceChange24h: market.price_change_24h,
        priceChangePercentage24h: market.price_change_24h,
        demandLevel: market.demand_level,
        supplyLevel: market.supply_level,
        volatilityIndex: market.volatility_index,
        seasonalityScore: market.seasonality_score,
        trendDirection: market.trend_direction,
      }
    })
  } catch (error) {
    console.error('Error fetching market data:', error)
    return []
  }
}

export async function calculateUserBehavior(userId: string): Promise<UserBehavior | null> {
  try {
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (txError) throw txError

    const { data: listings, error: listError } = await supabase
      .from('b2b_listings')
      .select('*')
      .eq('user_id', userId)

    if (listError) throw listError

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const createdListings = listings?.length || 0
    const activeListings = listings?.filter((listing) => listing.status === 'active').length || 0
    const closedListings = createdListings - activeListings
    const completedTransactions =
      transactions?.filter((transaction) => transaction.status === 'completed').length || 0
    const totalTransactions = transactions?.length || 0
    const canceledTransactions =
      transactions?.filter((transaction) => transaction.status === 'canceled').length || 0

    const totalValue =
      transactions?.reduce((sum, transaction) => sum + (transaction.total_value || 0), 0) || 0
    const avgValue = completedTransactions > 0 ? totalValue / completedTransactions : 0

    const accountAgeMs = Date.now() - new Date(profile.created_at).getTime()
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24))

    const lastTransaction = transactions?.[0]
    const lastTransactionMs = lastTransaction
      ? Date.now() - new Date(lastTransaction.created_at).getTime()
      : Infinity
    const lastTransactionDays = Math.floor(lastTransactionMs / (1000 * 60 * 60 * 24))

    return {
      userId,
      listingsCreated: createdListings,
      listingsActive: activeListings,
      listingsClosed: closedListings,
      avgResponseTime: 45,
      completionRate: totalTransactions > 0 ? completedTransactions / totalTransactions : 0,
      cancelationRate: totalTransactions > 0 ? canceledTransactions / totalTransactions : 0,
      avgOrderValue: avgValue,
      totalTransactionValue: totalValue,
      tradingFrequency:
        completedTransactions > 20 ? 'high' : completedTransactions > 5 ? 'medium' : 'low',
      accountAge: accountAgeDays,
      lastTransactionDays: lastTransactionDays === Infinity ? 999 : lastTransactionDays,
      qualityScore: calculateQualityScore(
        completedTransactions / Math.max(1, totalTransactions),
        canceledTransactions / Math.max(1, totalTransactions)
      ),
    }
  } catch (error) {
    console.error('Error calculating user behavior:', error)
    return null
  }
}

function calculateQualityScore(completionRate: number, cancelationRate: number): number {
  return Math.floor(
    Math.max(0, Math.min(100, completionRate * 100 - cancelationRate * 50))
  )
}

export async function runDecisionEngineWithSupabase(
  userId: string
): Promise<DecisionOutput | null> {
  try {
    const [userProfile, marketData, userBehavior] = await Promise.all([
      fetchUserProfile(userId),
      fetchMarketData(),
      calculateUserBehavior(userId),
    ])

    if (!userProfile || !marketData.length || !userBehavior) {
      console.error('Missing required data for decision engine')
      return null
    }

    const engine = new DecisionEngine({
      logLevel: 'info',
      enableCaching: true,
      cacheTTLSeconds: 300,
      minConfidenceThreshold: 0.5,
    })

    return engine.runDecisionEngine(userProfile, marketData, userBehavior)
  } catch (error) {
    console.error('Error running decision engine:', error)
    return null
  }
}

export async function storeDecisionOutput(output: DecisionOutput): Promise<boolean> {
  try {
    const { error } = await supabase.from('decision_outputs').insert({
      user_id: output.userId,
      session_id: output.sessionId,
      insights: output.insights,
      recommendations: output.recommendations,
      summary: output.summary,
      execution_time: output.executionTime,
      rules_executed: output.rulesExecuted,
      rules_trigger: output.rulesTrigger,
      created_at: new Date(),
    })

    if (error) throw error

    console.log('Decision output stored successfully')
    return true
  } catch (error) {
    console.error('Error storing decision output:', error)
    return false
  }
}

export async function getPreviousDecisions(
  userId: string,
  limit: number = 10
): Promise<DecisionOutput[]> {
  try {
    const { data, error } = await supabase
      .from('decision_outputs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data ?? []).map((row) => ({
      userId: row.user_id,
      timestamp: new Date(row.created_at),
      sessionId: row.session_id,
      insights: row.insights,
      recommendations: row.recommendations,
      summary: row.summary,
      executionTime: row.execution_time,
      rulesExecuted: row.rules_executed,
      rulesTrigger: row.rules_trigger,
    }))
  } catch (error) {
    console.error('Error fetching previous decisions:', error)
    return []
  }
}

export async function createDecisionEngineTables(): Promise<void> {
  const sql = `
    -- Users table (if not exists)
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      email VARCHAR(255) NOT NULL,
      region VARCHAR(255),
      farm_size NUMERIC,
      crop_types TEXT[],
      experience_level VARCHAR(50),
      preferred_communication_channel VARCHAR(50),
      risk_tolerance VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      last_active_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Market data table
    CREATE TABLE IF NOT EXISTS market_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      commodity_id UUID REFERENCES commodities(id),
      current_price NUMERIC NOT NULL,
      price_unit VARCHAR(50),
      price_change_24h NUMERIC,
      demand_level VARCHAR(50),
      supply_level VARCHAR(50),
      volatility_index NUMERIC,
      seasonality_score NUMERIC,
      trend_direction VARCHAR(50),
      timestamp TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      listing_id UUID,
      total_value NUMERIC,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Decision outputs table
    CREATE TABLE IF NOT EXISTS decision_outputs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      session_id VARCHAR(255) NOT NULL,
      insights JSONB,
      recommendations JSONB,
      summary TEXT,
      execution_time INTEGER,
      rules_executed INTEGER,
      rules_trigger TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_decision_outputs_user ON decision_outputs(user_id, created_at DESC);
  `

  console.log('Run this SQL in Supabase SQL editor to create tables:')
  console.log(sql)
}

export async function runScheduledDecisionAnalysis(): Promise<void> {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('active', true)

    if (error) throw error

    for (const user of users) {
      console.log(`Running decision engine for user: ${user.id}`)

      const output = await runDecisionEngineWithSupabase(user.id)
      if (output) {
        await storeDecisionOutput(output)
      }
    }

    console.log('Scheduled decision analysis completed')
  } catch (error) {
    console.error('Error in scheduled decision analysis:', error)
  }
}
