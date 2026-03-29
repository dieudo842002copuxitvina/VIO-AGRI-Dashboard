export interface MatchRequestBody {
  listing_id: string
}

export interface BuyerMatch {
  buyer_id: string
  score: number
  match_reasons: string[]
  buyer_role?: 'trader' | 'exporter' | 'unknown'
  buyer_region?: string
  trust_score?: number
  verified?: boolean
  last_activity_at?: string | null
  activity_score?: number
  is_fallback?: boolean
  notification_status?: 'mock_sent' | 'skipped'
}

export interface MatchResponse {
  matches: BuyerMatch[]
}

export interface ListingCandidate {
  id: string
  user_id: string
  commodity: string
  quantity: number
  price_per_unit: number
  region: string
  status: string
  created_at: string | null
  updated_at: string | null
}

export interface BuyerProfileCandidate {
  user_id: string
  role: 'farmer' | 'trader' | 'exporter' | 'unknown'
  region: string
  interests: string[]
  trust_score: number
  verified: boolean
  updated_at: string | null
}

export interface BuyerBehaviorSignals {
  user_id: string
  active_listing_count: number
  recent_listing_count: number
  same_commodity_listing_count: number
  average_price_for_commodity: number | null
  average_quantity_for_commodity: number | null
  last_activity_at: string | null
}
