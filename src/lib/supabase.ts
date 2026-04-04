import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

type GlobalWithSupabaseClient = typeof globalThis & {
  __vioAgriSupabaseBrowserClient?: SupabaseClient
}

function createSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    browserClient ??= createSupabaseBrowserClient()
    return browserClient
  }

  const globalWithSupabaseClient = globalThis as GlobalWithSupabaseClient

  globalWithSupabaseClient.__vioAgriSupabaseBrowserClient ??= createSupabaseBrowserClient()

  return globalWithSupabaseClient.__vioAgriSupabaseBrowserClient
}
