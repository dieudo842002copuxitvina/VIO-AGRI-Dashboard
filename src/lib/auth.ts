import { getSupabaseServerClient } from './supabase/server'
import type { UserProfile, Role } from '@/types/auth'
import { createClient } from '@supabase/supabase-js'

export type AuthHeaders = {
  authorization?: string
  apikey?: string
  cookie?: string
}

/**
 * Server-side admin guard - use in API routes
 */
export async function requireAdminRole(headers: AuthHeaders): Promise<{ user: UserProfile, supabase: ReturnType<typeof getSupabaseServerClient> }> {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser(headers as any)

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: UserProfile | null, error: { message: string } | null }

  if (error || !profile || profile.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return { user: profile, supabase }
}

/**
 * Check if user has specific role
 */
export async function hasRole(userId: string, requiredRole: Role, headers: AuthHeaders) {
  const supabase = getSupabaseServerClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single()

  return profile?.role === requiredRole
}

/**
 * Get admin users list (for superadmin only)
 */
export async function getAdminUsers(headers: AuthHeaders) {
  const { supabase } = await requireAdminRole(headers)
  return supabase
    .from('user_profiles')
    .select('*, auth_users:auth.users(email)')
    .eq('role', 'admin')
}
