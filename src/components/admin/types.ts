// This is a central types file for the admin dashboard.
// In a real app, you might split this further.

export const adminNavItems = [
  'Overview',
  'Listings',
  'Users',
  'Transactions',
  'Experiments',
  'AI Debug',
] as const

export type AdminNavItem = (typeof adminNavItems)[number]

// Types for AI Debug Panel
export interface UserProfile {
  user_id: string
  role: string
  region: string
  interests: string[]
}

export interface MarketData {
  id: string
  commodity: string
  price: number
  trend: 'up' | 'down' | 'sideways'
}

export interface DecisionInsight {
  title: string
  type: 'opportunity' | 'risk'
  confidence: number
  matchedRule?: string // For trace mode
}

export interface DecisionResponse {
  userId: string
  insights: DecisionInsight[]
  summary: string
}

export interface AIRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD'
  commodity: string
  reasoning: string
  confidenceScore: number
  scoringBreakdown?: Record<string, number> // For trace mode
}

export interface RecommendationResponse {
  recommendations: AIRecommendation[]
  summary: string
}

export interface AIDebugResponse {
  decision: DecisionResponse
  recommendation: RecommendationResponse
}

export interface AIDebugError {
  message: string
  status?: number
}

export interface AIDebugState {
  users: UserProfile[]
  marketData: MarketData[]
  selectedUserId: string | null
  isLoading: boolean
  error: AIDebugError | null
  lastResponse: AIDebugResponse | null
  showTrace: boolean
}

// Placeholder types for other components to ensure no errors
export type ListingStatus = 'pending' | 'approved' | 'rejected'
export interface ListingRecord {
  id: string
  commodity: string
  price: number
  marketPrice: number
  status: ListingStatus
  suspicious: boolean
  anomalyScore: number
}
export const adminListings: ListingRecord[] = []

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
export interface RiskAlert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  entityId: string
  entityLabel: string
  signal: string
}
export const riskAlerts: RiskAlert[] = []
export const revenueMetrics: any[] = []
export const revenueSeries: any[] = []

// Type and data for AdminDashboard stats
export interface AdminStat {
  label: string
  value: number
  change: string
}

export const adminStats: AdminStat[] = [
  {
    label: 'Active Users',
    value: 1478,
    change: '+12% from last month',
  },
  {
    label: 'Total Listings',
    value: 482,
    change: '+5.2% from last week',
  },
  {
    label: 'Market Volume',
    value: 1289000,
    change: '2% below projections',
  },
]