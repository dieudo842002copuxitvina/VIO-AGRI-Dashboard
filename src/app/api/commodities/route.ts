import { NextResponse } from 'next/server'
import { getAllLatestCommodityPrices } from '@/services/data/commodity-ingestion'

/**
 * GET /api/commodities
 * Fetch latest normalized commodity prices from Supabase
 * Reads historical snapshots and returns the latest row per commodity
 */
export async function GET() {
  try {
    console.log('[API /commodities] Fetching latest commodity prices...')
    
    const prices = await getAllLatestCommodityPrices()

    if (!prices || prices.length === 0) {
      console.warn('[API /commodities] No commodity data in database, returning empty array')
      return NextResponse.json([])
    }

    // Transform to API response format
    const apiResponse = prices.map(price => ({
      id: price.id,
      name: price.name,
      symbol: price.symbol,
      unit: price.unit,
      current_price: price.price,
      change_24h: price.change24h,
      change_percent_24h: price.changePercent24h,
      trend: price.trendDirection === 'uptrend' ? 'up' : price.trendDirection === 'downtrend' ? 'down' : 'stable',
      demand_level: price.demandLevel,
      supply_level: price.supplyLevel,
      volatility_index: price.volatilityIndex,
      timestamp: price.timestamp,
      source: price.source,
    }))

    console.log(`[API /commodities] Returning ${apiResponse.length} commodity prices`)
    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('[API /commodities] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commodity prices' },
      { status: 500 }
    )
  }
}

