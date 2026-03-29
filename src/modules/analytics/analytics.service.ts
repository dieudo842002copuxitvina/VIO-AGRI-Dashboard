import { getSupabaseServerClient } from '@/lib/supabase/server'
import { toIsoTimestamp, toSafeText } from '@/lib/safe-data'

export interface PlatformEventInput {
  event_name: string
  user_id?: string | null
  entity_type?: string | null
  entity_id?: string | null
  metadata?: Record<string, unknown>
  timestamp?: string | null
}

export async function logPlatformEvent(input: PlatformEventInput): Promise<void> {
  const eventName = toSafeText(input.event_name, 'platform_event')
  const payload = {
    event_name: eventName,
    user_id: toSafeText(input.user_id, '') || null,
    entity_type: toSafeText(input.entity_type, '') || null,
    entity_id: toSafeText(input.entity_id, '') || null,
    metadata: input.metadata ?? {},
    created_at: toIsoTimestamp(input.timestamp),
  }

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('platform_events').insert(payload)

    if (error) {
      console.info('[Analytics] Event persisted to console only', {
        eventName,
        error: error.message,
        payload,
      })
    }
  } catch (error) {
    console.info('[Analytics] Event logging fallback', {
      eventName,
      error: error instanceof Error ? error.message : 'Unknown error',
      payload,
    })
  }
}
