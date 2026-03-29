/**
 * Mock Data Generators for Development and Testing
 * 
 * Provides realistic mock data that mimics Supabase queries
 * In production, replace these with actual database calls
 */

import type { UserProfile, MarketData, UserBehavior } from '@/modules/decision/decision.types'

/**
 * Generate mock user profile
 * Simulates data from user_profiles table
 */
export function getMockUserProfile(userId: string): UserProfile {
  const profiles: Record<string, UserProfile> = {
    'user_001': {
      id: 'user_001',
      email: 'duc.nguyen@farm.vn',
      region: 'Mekong Delta',
      farmSize: 40,
      cropTypes: ['rice', 'vegetables', 'shrimp'],
      experienceLevel: 'intermediate',
      preferredCommunicationChannel: 'email',
      createdAt: new Date('2023-01-15'),
      lastActiveAt: new Date(),
      riskTolerance: 'medium',
    },
    'user_002': {
      id: 'user_002',
      email: 'tuan.pham@farm.vn',
      region: 'Red River Delta',
      farmSize: 25,
      cropTypes: ['rice', 'corn'],
      experienceLevel: 'beginner',
      preferredCommunicationChannel: 'sms',
      createdAt: new Date('2024-03-10'),
      lastActiveAt: new Date(),
      riskTolerance: 'low',
    },
    'user_003': {
      id: 'user_003',
      email: 'linh.tran@farm.vn',
      region: 'Central Highlands',
      farmSize: 100,
      cropTypes: ['coffee', 'cocoa', 'pepper'],
      experienceLevel: 'advanced',
      preferredCommunicationChannel: 'in-app',
      createdAt: new Date('2022-06-20'),
      lastActiveAt: new Date(),
      riskTolerance: 'high',
    },
  }

  return profiles[userId] || {
    id: userId,
    email: `user.${userId}@farm.vn`,
    region: 'Mekong Delta',
    farmSize: Math.floor(Math.random() * 100) + 10,
    cropTypes: ['rice', 'vegetables'],
    experienceLevel: 'intermediate',
    preferredCommunicationChannel: 'email',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(),
    riskTolerance: 'medium',
  }
}

/**
 * Generate mock market data
 * Simulates data from market_data table for a specific commodity
 */
export function getMockMarketData(commodityName: string): MarketData {
  const marketData: Record<string, MarketData> = {
    rice: {
      timestamp: new Date(),
      commodityId: 'commodity_rice_001',
      commodityName: 'Rice',
      currentPrice: 7500, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: 125, // +125 VND
      priceChangePercentage24h: 1.7,
      demandLevel: 'high',
      supplyLevel: 'medium',
      volatilityIndex: 45,
      seasonalityScore: 25,
      trendDirection: 'uptrend',
    },
    vegetables: {
      timestamp: new Date(),
      commodityId: 'commodity_veg_001',
      commodityName: 'Vegetables (Mixed)',
      currentPrice: 15000, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: 250,
      priceChangePercentage24h: 1.7,
      demandLevel: 'high',
      supplyLevel: 'high',
      volatilityIndex: 35,
      seasonalityScore: 10,
      trendDirection: 'sideways',
    },
    shrimp: {
      timestamp: new Date(),
      commodityId: 'commodity_shrimp_001',
      commodityName: 'Shrimp (Farmed)',
      currentPrice: 250000, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: 5000,
      priceChangePercentage24h: 2.0,
      demandLevel: 'high',
      supplyLevel: 'low',
      volatilityIndex: 60,
      seasonalityScore: 35,
      trendDirection: 'uptrend',
    },
    corn: {
      timestamp: new Date(),
      commodityId: 'commodity_corn_001',
      commodityName: 'Corn',
      currentPrice: 4500, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: -90,
      priceChangePercentage24h: -2.0,
      demandLevel: 'medium',
      supplyLevel: 'high',
      volatilityIndex: 50,
      seasonalityScore: -15,
      trendDirection: 'downtrend',
    },
    coffee: {
      timestamp: new Date(),
      commodityId: 'commodity_coffee_001',
      commodityName: 'Coffee Beans',
      currentPrice: 35000, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: 700,
      priceChangePercentage24h: 2.0,
      demandLevel: 'high',
      supplyLevel: 'medium',
      volatilityIndex: 55,
      seasonalityScore: 40,
      trendDirection: 'uptrend',
    },
    cocoa: {
      timestamp: new Date(),
      commodityId: 'commodity_cocoa_001',
      commodityName: 'Cocoa',
      currentPrice: 45000, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: 900,
      priceChangePercentage24h: 2.0,
      demandLevel: 'high',
      supplyLevel: 'low',
      volatilityIndex: 65,
      seasonalityScore: 30,
      trendDirection: 'uptrend',
    },
    pepper: {
      timestamp: new Date(),
      commodityId: 'commodity_pepper_001',
      commodityName: 'Black Pepper',
      currentPrice: 120000, // VND per kg
      priceUnit: 'VND/kg',
      priceChange24h: 2400,
      priceChangePercentage24h: 2.0,
      demandLevel: 'medium',
      supplyLevel: 'medium',
      volatilityIndex: 45,
      seasonalityScore: 20,
      trendDirection: 'uptrend',
    },
  }

  // Normalize commodity name for lookup
  const normalized = commodityName.toLowerCase()
  return (
    marketData[normalized] || {
      timestamp: new Date(),
      commodityId: `commodity_${normalized}_001`,
      commodityName: commodityName,
      currentPrice: Math.floor(Math.random() * 100000) + 1000,
      priceUnit: 'VND/kg',
      priceChange24h: Math.floor(Math.random() * 1000) - 500,
      priceChangePercentage24h: (Math.random() * 4) - 2,
      demandLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as
        | 'low'
        | 'medium'
        | 'high',
      supplyLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as
        | 'low'
        | 'medium'
        | 'high',
      volatilityIndex: Math.floor(Math.random() * 100),
      seasonalityScore: Math.floor(Math.random() * 200) - 100,
      trendDirection: ['uptrend', 'downtrend', 'sideways'][Math.floor(Math.random() * 3)] as
        | 'uptrend'
        | 'downtrend'
        | 'sideways',
    }
  )
}

/**
 * Generate mock user behavior
 * Simulates data from user_behavior table
 */
export function getMockUserBehavior(userId: string): UserBehavior {
  const behaviors: Record<string, UserBehavior> = {
    'user_001': {
      userId: 'user_001',
      listingsCreated: 45,
      listingsActive: 8,
      listingsClosed: 37,
      avgResponseTime: 2.5,
      completionRate: 0.92,
      cancelationRate: 0.03,
      avgOrderValue: 5000000,
      totalTransactionValue: 225000000,
      tradingFrequency: 'high',
      accountAge: 450,
      lastTransactionDays: 1,
      qualityScore: 88,
    },
    'user_002': {
      userId: 'user_002',
      listingsCreated: 12,
      listingsActive: 3,
      listingsClosed: 9,
      avgResponseTime: 8.0,
      completionRate: 0.75,
      cancelationRate: 0.08,
      avgOrderValue: 2000000,
      totalTransactionValue: 18000000,
      tradingFrequency: 'low',
      accountAge: 90,
      lastTransactionDays: 7,
      qualityScore: 62,
    },
    'user_003': {
      userId: 'user_003',
      listingsCreated: 156,
      listingsActive: 22,
      listingsClosed: 134,
      avgResponseTime: 0.8,
      completionRate: 0.98,
      cancelationRate: 0.01,
      avgOrderValue: 15000000,
      totalTransactionValue: 2340000000,
      tradingFrequency: 'high',
      accountAge: 1200,
      lastTransactionDays: 0,
      qualityScore: 96,
    },
  }

  return behaviors[userId] || {
    userId,
    listingsCreated: Math.floor(Math.random() * 50),
    listingsActive: Math.floor(Math.random() * 10),
    listingsClosed: Math.floor(Math.random() * 40),
    avgResponseTime: Math.random() * 20,
    completionRate: 0.5 + Math.random() * 0.45,
    cancelationRate: Math.random() * 0.1,
    avgOrderValue: Math.floor(Math.random() * 10000000) + 1000000,
    totalTransactionValue: Math.floor(Math.random() * 1000000000),
    tradingFrequency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as
      | 'low'
      | 'medium'
      | 'high',
    accountAge: Math.floor(Math.random() * 1000) + 30,
    lastTransactionDays: Math.floor(Math.random() * 30),
    qualityScore: Math.floor(Math.random() * 100),
  }
}

/**
 * Example usage and test data
 */
export const MOCK_USER_IDS = ['user_001', 'user_002', 'user_003']

export function getMockTestData(userId: string = 'user_001') {
  const userProfile = getMockUserProfile(userId)
  const marketDataArray = userProfile.cropTypes.map((crop) => getMockMarketData(crop))
  const userBehavior = getMockUserBehavior(userId)

  return {
    userProfile,
    marketDataArray,
    userBehavior,
  }
}

