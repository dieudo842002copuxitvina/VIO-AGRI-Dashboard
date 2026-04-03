export type Role = 'farmer' | 'trader' | 'exporter' | 'admin'

export interface UserProfile {
  user_id: string
  role: Role
  business_name?: string | null
  region?: string | null
  interests?: string[]
  trust_score: number
  verified: boolean
  created_at: string
  updated_at: string
  factors?: Record<string, unknown>
}

export interface AuthUser extends UserProfile {
  email: string
  id: string
}

export interface AuthSession {
  user: AuthUser
  expires_at: string
}
