import type Stripe from "stripe"
import { getSupabaseAdmin } from "./supabase-admin"

/**
 * Contract for the `entitlements` table in Supabase (Postgres).
 *
 * This file does NOT create the table; you should provision it in Supabase with
 * roughly this schema:
 *
 * create table public.entitlements (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id text not null,
 *   type text not null check (type in ('oneoff','subscription')),
 *   remaining_uses integer,
 *   status text not null default 'active', -- e.g. 'active' | 'consumed' | 'canceled'
 *   stripe_checkout_session_id text,
 *   stripe_customer_id text,
 *   stripe_subscription_id text,
 *   created_at timestamptz default now()
 * );
 */

export async function grantPremiumEntitlementFromCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const admin = getSupabaseAdmin()
  if (!admin) {
    console.warn("Supabase admin client not configured; skipping entitlement grant.")
    return
  }

  const userId = session.metadata?.userId
  if (!userId) {
    console.warn("Stripe checkout session missing userId metadata; cannot grant entitlement.")
    return
  }

  const type: "oneoff" | "subscription" = session.mode === "subscription" ? "subscription" : "oneoff"

  const { error } = await admin.from("entitlements").insert({
    user_id: userId,
    type,
    remaining_uses: type === "oneoff" ? 1 : null,
    status: "active",
    stripe_checkout_session_id: session.id,
    stripe_customer_id: session.customer ? String(session.customer) : null,
    stripe_subscription_id: session.subscription ? String(session.subscription) : null,
  })

  if (error) {
    console.error("Failed to insert entitlement from Stripe checkout session:", error)
  }
}

export async function hasActiveSubscriptionEntitlement(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()
  if (!admin) return false

  const { data, error } = await admin
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "subscription")
    .eq("status", "active")
    .limit(1)

  if (error) {
    console.error("Error checking subscription entitlement:", error)
    return false
  }

  return !!(data && data.length > 0)
}

export async function consumeOnePremiumEntitlement(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()
  if (!admin) return false

  // Find one active one-off entitlement with remaining_uses > 0
  const { data, error } = await admin
    .from("entitlements")
    .select("id, remaining_uses")
    .eq("user_id", userId)
    .eq("type", "oneoff")
    .eq("status", "active")
    .gt("remaining_uses", 0)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Error fetching one-off entitlement:", error)
    return false
  }

  if (!data) {
    return false
  }

  const newRemaining = (data.remaining_uses ?? 0) - 1
  const newStatus = newRemaining <= 0 ? "consumed" : "active"

  const { error: updateError } = await admin
    .from("entitlements")
    .update({ remaining_uses: newRemaining, status: newStatus })
    .eq("id", data.id)

  if (updateError) {
    console.error("Error updating entitlement after consumption:", updateError)
    return false
  }

  return true
}
