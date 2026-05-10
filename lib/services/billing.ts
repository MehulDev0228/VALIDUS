import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { hasActiveSubscriptionEntitlement } from "@/lib/entitlements"

export type PlanTier = "free" | "pro" | "team"

/** Pro / Team profile plan, active Stripe subscription entitlements, or one-off premium credits (legacy). */
export async function userHasUnlimitedMemos(userId: string): Promise<boolean> {
  const tier = await getPlanForUser(userId)
  if (tier === "pro" || tier === "team") return true
  if (await hasActiveSubscriptionEntitlement(userId)) return true
  return false
}

export async function getPlanForUser(userId: string): Promise<PlanTier> {
  const admin = getSupabaseAdmin()
  if (!admin) return "free"

  const { data, error } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle()

  if (error || !data?.plan) return "free"
  const p = data.plan as string
  if (p === "pro" || p === "team") return p
  return "free"
}

export async function userHasActiveSubscription(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()
  if (!admin) return false

  const { data, error } = await admin
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("type", "subscription")
    .limit(1)

  if (error) return false
  return Boolean(data?.length)
}
