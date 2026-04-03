import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

function buildSupabaseClient(supabaseUrl: string, key: string): SupabaseClient {
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  adminClient = buildSupabaseClient(supabaseUrl, serviceRoleKey)

  return adminClient
}

export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) {
    return serverClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serverKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !serverKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL and a usable Supabase server key')
  }

  serverClient = buildSupabaseClient(supabaseUrl, serverKey)

  return serverClient
}
