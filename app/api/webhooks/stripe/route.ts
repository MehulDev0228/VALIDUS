import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe, getStripeWebhookSecret } from "@/lib/billing/stripe"
import { grantPremiumEntitlementFromCheckout } from "@/lib/entitlements"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

async function setProfilePlan(userId: string, plan: "free" | "pro" | "team") {
  const admin = getSupabaseAdmin()
  if (!admin) return
  await admin.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("id", userId)
}

function planFromCheckoutMetadata(session: Stripe.Checkout.Session): "pro" | "team" | null {
  const t = session.metadata?.billingTier
  if (t === "team") return "team"
  if (t === "pro") return "pro"
  return null
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const secret = getStripeWebhookSecret()
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 503 })
  }

  const sig = request.headers.get("stripe-signature")
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig || "", secret)
  } catch (err) {
    console.error("[stripe webhook] signature", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await grantPremiumEntitlementFromCheckout(session)
        const userId = session.metadata?.userId
        if (userId && session.mode === "subscription") {
          const tier = planFromCheckoutMetadata(session)
          await setProfilePlan(userId, tier ?? "pro")
        }
        break
      }
      case "customer.subscription.deleted":
      case "customer.subscription.canceled": {
        const sub = event.data.object as Stripe.Subscription
        const admin = getSupabaseAdmin()
        if (!admin) break
        const { data: rows } = await admin
          .from("entitlements")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .limit(1)
        const uid = rows?.[0]?.user_id as string | undefined
        if (uid) await setProfilePlan(uid, "free")
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error("[stripe webhook] handler", e)
    return NextResponse.json({ received: true, error: "handler_failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
