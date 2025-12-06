import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Returns a Supabase client configured with the service role key.
 *
 * In production you must set:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * If these are missing, entitlement helpers will log and no-op rather than
 * crashing the application. This keeps local/dev flows usable while making
 * it obvious that persistence is not configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey || url === "https://placeholder.supabase.co") {
    return null
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
