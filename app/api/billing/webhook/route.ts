import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe, getStripeWebhookSecret } from "@/lib/billing/stripe"
import { grantPremiumEntitlementFromCheckout } from "@/lib/entitlements"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    if (!stripe) {
      console.warn("Stripe not configured; ignoring webhook call.")
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const webhookSecret = getStripeWebhookSecret()
    if (!webhookSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET not set; ignoring webhook verification.")
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const rawBody = await request.text()
    const sig = request.headers.get("stripe-signature") || ""

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err?.message || err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      await grantPremiumEntitlementFromCheckout(session)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error("/api/billing/webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
