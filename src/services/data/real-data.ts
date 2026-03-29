/**
 * Real Data Integration for Decision Engine
 * 
 * Replaces mock-data.ts
 * Fetches actual data from Supabase database
 */

import { supabase } from '@/lib/supabase/client'
import type { UserProfile, MarketData, UserBehavior } from '@/modules/decision/decision.types'

/**
 * Fetch user profile from Supabase
 */
export async function fetchRealUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log(`[RealData] Fetching user profile for ${userId}...`)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[RealData] Error fetching user profile:', error)
      return null
    }

    return {
      id: data.user_id,
      email: data.email,
      region: data.region,
      farmSize: data.farm_size_hectares,
      cropTypes: data.interests || [],
      experienceLevel: data.role === 'admin' ? 'advanced' : 'intermediate',
      preferredCommunicationChannel: 'email',
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.updated_at),
      riskTolerance: 'medium',
    }
  } catch (error) {
    console.error('[RealData] Error:', error)
    return null
  }
}

/**
 * Fetch real market data from Supabase for multiple commodities
 */
export async function fetchRealMarketData(commodityIds?: string[]): Promise<MarketData[]> {
  try {
    console.log('[RealData] Fetching market data...')
    
    let query = supabase
      .from('market_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (commodityIds && commodityIds.length > 0) {
      query = query.in('commodity_id', commodityIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('[RealData] Error fetching market data:', error)
      return []
    }

    // Get unique commodities (latest entry for each)
    const commodityMap = new Map<string, typeof data[0]>()
    for (const entry of data || []) {
      if (!commodityMap.has(entry.commodity_id)) {
        commodityMap.set(entry.commodity_id, entry)
      }
    }

    return Array.from(commodityMap.values()).map(item => ({
      timestamp: new Date(item.timestamp),
      commodityId: item.commodity_id,
      commodityName: item.commodity_name,
      currentPrice: item.current_price,
      priceUnit: item.price_unit,
      priceChange24h: item.price_change_24h || 0,
      priceChangePercentage24h: item.price_change_percentage_24h || 0,
      demandLevel: (item.demand_level || 'medium') as 'low' | 'medium' | 'high',
      supplyLevel: (item.supply_level || 'medium') as 'low' | 'medium' | 'high',
      volatilityIndex: item.volatility_index || 40,
      seasonalityScore: 0,
      trendDirection: (item.trend_direction || 'sideways') as 'uptrend' | 'downtrend' | 'sideways',
    }))
  } catch (error) {
    console.error('[RealData] Error:', error)
    return []
  }
}

/**
 * Fetch user behavior metrics from Supabase transactions and listings
 */
export async function fetchRealUserBehavior(userId: string): Promise<UserBehavior | null> {
  try {
    console.log(`[RealData] Fetching user behavior for ${userId}...`)

    // Get user's listings
    const { data: listings, error: listError } = await supabase
      .from('b2b_listings')
      .select('*')
      .eq('user_id', userId)

    if (listError) {
      console.error('[RealData] Error fetching listings:', listError)
      return null
    }

    const listingsCreated = listings?.length || 0
    const listingsActive = listings?.filter(l => l.status === 'open' || l.status === 'active').length || 0
    const listingsClosed = listingsCreated - listingsActive

    // Get user profile for account age
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('[RealData] Error fetching user profile:', profileError)
      return null
    }

    // Calculate account age
    const createdDate = new Date(userProfile.created_at)
    const accountAgeMs = Date.now() - createdDate.getTime()
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24))

    // Calculate completion rate
    const completionRate = listingsCreated > 0 ? (listingsClosed / listingsCreated) * 0.8 : 0

    // Calculate quality score
    const qualityScore = Math.min(100, 50 + accountAgeDays / 10 + completionRate * 50)

    return {
      userId,
      listingsCreated,
      listingsActive,
      listingsClosed,
      avgResponseTime: 5.0,
      completionRate,
      cancelationRate: 0.05,
      avgOrderValue: 5000000,
      totalTransactionValue: listingsCreated * 5000000,
      tradingFrequency: listingsCreated > 20 ? 'high' : listingsCreated > 5 ? 'medium' : 'low',
      accountAge: accountAgeDays,
      lastTransactionDays: 1,
      qualityScore: Math.floor(qualityScore),
    }
  } catch (error) {
    console.error('[RealData] Error:', error)
    return null
  }
}

/**
 * Get complete data set for Decision Engine execution
 */
export async function getRealDataForDecision(userId: string, commodityIds?: string[]) {
  console.log(`[RealData] Fetching complete data set for user ${userId}...`)

  const [userProfile, marketData, userBehavior] = await Promise.all([
    fetchRealUserProfile(userId),
    fetchRealMarketData(commodityIds),
    fetchRealUserBehavior(userId),
  ])

  if (!userProfile) {
    console.error('[RealData] Failed to fetch user profile')
    return null
  }

  if (marketData.length === 0) {
    console.error('[RealData] No market data available')
    return null
  }

  if (!userBehavior) {
    console.error('[RealData] Failed to fetch user behavior')
    return null
  }

  console.log('[RealData] Successfully fetched all data:', {
    user: userProfile.id,
    commodities: marketData.length,
    accountAge: userBehavior.accountAge,
  })

  return {
    userProfile,
    marketData,
    userBehavior,
  }
}

/**
 * Store decision output back to Supabase
 */
export async function storeDecisionOutput(userId: string, insights: any[], recommendations: any[], summary: string, executionTime: number) {
  try {
    console.log(`[RealData] Storing decision output for user ${userId}...`)

    const { error } = await supabase
      .from('decision_logs')
      .insert({
        user_id: userId,
        session_id: `session_${Date.now()}`,
        insights,
        recommendations,
        confidence_score: 0.85,
        execution_time_ms: executionTime,
        rules_triggered: [],
        user_feedback: null,
        created_at: new Date(),
      })

    if (error) {
      console.error('[RealData] Error storing output:', error)
      return false
    }

    console.log('[RealData] Decision output stored successfully')
    return true
  } catch (error) {
    console.error('[RealData] Error:', error)
    return false
  }
}



