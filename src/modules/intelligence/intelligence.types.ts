export type MarketTrend = 'up' | 'down' | 'stable'
export type ClimateRiskLevel = 'low' | 'medium' | 'high'

export interface CommodityPriceSnapshot {
  commodity: string
  price: number
  unit: string
  trend: MarketTrend
  change_percent: number
  demand_level: 'low' | 'medium' | 'high'
  supply_level: 'low' | 'medium' | 'high'
  volatility_index: number
  region: string
  timestamp: string
  source: string
}

export interface MarketHistoryPoint {
  period: string
  [commodityKey: string]: string | number
}

export interface MarketDataResponse {
  market: CommodityPriceSnapshot[]
  history: MarketHistoryPoint[]
  timestamp: string
}

export interface ClimateSignal {
  commodity: string
  region: string
  risk_level: ClimateRiskLevel
  summary: string
  action_hint: string
  timestamp: string
}

export interface ClimateResponse {
  climate: ClimateSignal[]
  timestamp: string
}
