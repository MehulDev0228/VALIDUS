/**
 * Auth service — thin facade over Supabase clients for app code.
 */

export { getBrowserSupabase } from "@/lib/supabase/client"
export { createClient as createServerSupabase } from "@/lib/supabase/server"
export { getAuthSession, type AuthSession } from "@/lib/auth"
