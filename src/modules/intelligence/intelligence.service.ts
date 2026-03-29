import { getSupabaseServerClient } from '@/lib/supabase/server'
import { asRecord, toIsoTimestamp, toSafeNumber, toSafeText } from '@/lib/safe-data'

import type {
  ClimateResponse,
  ClimateSignal,
  CommodityPriceSnapshot,
  MarketDataResponse,
  MarketHistoryPoint,
  MarketTrend,
} from '@/modules/intelligence/intelligence.types'

const FALLBACK_MARKET: CommodityPriceSnapshot[] = [
  {
    commodity: 'Coffee',
    price: 3300,
    unit: 'USD/mt',
    trend: 'up',
    change_percent: 6.5,
    demand_level: 'high',
    supply_level: 'medium',
    volatility_index: 42,
    region: 'Central Highlands',
    timestamp: new Date().toISOString(),
    source: 'fallback',
  },
  {
    commodity: 'Pepper',
    price: 98000,
    unit: 'VND/kg',
    trend: 'up',
    change_percent: 4.1,
    demand_level: 'medium',
    supply_level: 'medium',
    volatility_index: 36,
    region: 'Dong Nai',
    timestamp: new Date().toISOString(),
    source: 'fallback',
  },
  {
    commodity: 'Rice',
    price: 14800,
    unit: 'VND/kg',
    trend: 'stable',
    change_percent: 1.2,
    demand_level: 'high',
    supply_level: 'high',
    volatility_index: 24,
    region: 'Mekong Delta',
    timestamp: new Date().toISOString(),
    source: 'fallback',
  },
]

const FALLBACK_HISTORY: MarketHistoryPoint[] = [
  { period: 'Oct', coffee: 3100, pepper: 82000, rice: 13400 },
  { period: 'Nov', coffee: 3150, pepper: 85000, rice: 13600 },
  { period: 'Dec', coffee: 3080, pepper: 89000, rice: 13800 },
  { period: 'Jan', coffee: 3200, pepper: 91000, rice: 14100 },
  { period: 'Feb', coffee: 3250, pepper: 95000, rice: 14500 },
  { period: 'Mar', coffee: 3300, pepper: 98000, rice: 14800 },
]

function toDemandLevel(value: unknown): CommodityPriceSnapshot['demand_level'] {
  const safeValue = toSafeText(value, 'medium').toLowerCase()
  return safeValue === 'low' || safeValue === 'high' ? safeValue : 'medium'
}

function toSupplyLevel(value: unknown): CommodityPriceSnapshot['supply_level'] {
  const safeValue = toSafeText(value, 'medium').toLowerCase()
  return safeValue === 'low' || safeValue === 'high' ? safeValue : 'medium'
}

function toTrend(value: unknown): MarketTrend {
  const safeValue = toSafeText(value, 'stable').toLowerCase()

  if (safeValue.includes('up')) {
    return 'up'
  }

  if (safeValue.includes('down')) {
    return 'down'
  }

  return 'stable'
}

function normalizeMarketRow(raw: unknown): CommodityPriceSnapshot | null {
  const record = asRecord(raw)
  const commodity =
    toSafeText(record?.commodity_name, '') ||
    toSafeText(record?.commodity, '') ||
    toSafeText(record?.name, '')

  if (!commodity) {
    return null
  }

  return {
    commodity,
    price: toSafeNumber(record?.current_price, 0) || toSafeNumber(record?.price, 0),
    unit: toSafeText(record?.price_unit, toSafeText(record?.unit, 'VND/kg')),
    trend: toTrend(record?.trend_direction ?? record?.trend),
    change_percent:
      toSafeNumber(record?.price_change_percentage_24h, 0) ||
      toSafeNumber(record?.change_percent_24h, 0),
    demand_level: toDemandLevel(record?.demand_level),
    supply_level: toSupplyLevel(record?.supply_level),
    volatility_index: toSafeNumber(record?.volatility_index, 0),
    region: toSafeText(record?.region, 'Vietnam'),
    timestamp: toIsoTimestamp(record?.timestamp),
    source: toSafeText(record?.source, 'supabase'),
  }
}

function filterByRegion(market: CommodityPriceSnapshot[], region: string): CommodityPriceSnapshot[] {
  const safeRegion = toSafeText(region, '').toLowerCase()

  if (!safeRegion) {
    return market
  }

  return market.filter((item) => item.region.toLowerCase().includes(safeRegion))
}

function buildClimateSignal(
  commodity: string,
  region: string,
  changePercent: number,
  volatilityIndex: number
): ClimateSignal {
  const riskLevel: ClimateSignal['risk_level'] =
    volatilityIndex >= 50 || changePercent <= -3
      ? 'high'
      : volatilityIndex >= 30 || changePercent < 2
        ? 'medium'
        : 'low'

  const summary =
    riskLevel === 'high'
      ? `${commodity} in ${region} is exposed to elevated delivery and crop stress.`
      : riskLevel === 'medium'
        ? `${commodity} in ${region} needs closer climate and logistics monitoring.`
        : `${commodity} in ${region} is trading with relatively low climate pressure.`

  const actionHint =
    riskLevel === 'high'
      ? 'Move inventory faster and prioritize verified buyers with strong trust scores.'
      : riskLevel === 'medium'
        ? 'Keep negotiation windows short and confirm fulfillment capacity early.'
        : 'Market conditions support normal negotiation and fulfillment planning.'

  return {
    commodity,
    region,
    risk_level: riskLevel,
    summary,
    action_hint: actionHint,
    timestamp: new Date().toISOString(),
  }
}

export async function getMarketData(region?: string): Promise<MarketDataResponse> {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(60)

    if (error) {
      console.warn('[MarketData] Falling back to static market feed', { error: error.message })
      return {
        market: filterByRegion(FALLBACK_MARKET, region || ''),
        history: FALLBACK_HISTORY,
        timestamp: new Date().toISOString(),
      }
    }

    const latestByCommodity = new Map<string, CommodityPriceSnapshot>()

    for (const row of data || []) {
      const normalized = normalizeMarketRow(row)

      if (!normalized || latestByCommodity.has(normalized.commodity.toLowerCase())) {
        continue
      }

      latestByCommodity.set(normalized.commodity.toLowerCase(), normalized)
    }

    const market = filterByRegion(Array.from(latestByCommodity.values()), region || '')

    return {
      market: market.length > 0 ? market : filterByRegion(FALLBACK_MARKET, region || ''),
      history: FALLBACK_HISTORY,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.warn('[MarketData] Unavailable, using fallback data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      market: filterByRegion(FALLBACK_MARKET, region || ''),
      history: FALLBACK_HISTORY,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getClimateSignals(
  region?: string,
  commodities?: string[]
): Promise<ClimateResponse> {
  const marketData = await getMarketData(region)
  const commodityFilter = Array.isArray(commodities)
    ? commodities
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim().toLowerCase())
    : []

  const baseSignals = marketData.market
    .filter((item) => commodityFilter.length === 0 || commodityFilter.includes(item.commodity.toLowerCase()))
    .map((item) => buildClimateSignal(item.commodity, item.region, item.change_percent, item.volatility_index))

  return {
    climate: baseSignals.length > 0
      ? baseSignals
      : [buildClimateSignal('Coffee', toSafeText(region, 'Central Highlands'), 6.5, 42)],
    timestamp: new Date().toISOString(),
  }
}
