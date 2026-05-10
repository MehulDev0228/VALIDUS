import Stripe from "stripe"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null

export function assertStripeConfigured() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment.")
  }
}

export function getStripeWebhookSecret() {
  return STRIPE_WEBHOOK_SECRET
}

export interface CreateCheckoutParams {
  userId: string
  userEmail?: string | null
  mode: "oneoff" | "subscription"
  /** Subscription tier — selects Stripe price id env (defaults to Pro). */
  tier?: "pro" | "team"
}

export async function createPremiumValidationCheckoutSession(params: CreateCheckoutParams) {
  assertStripeConfigured()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  let priceId: string | undefined
  if (params.mode === "subscription") {
    priceId =
      params.tier === "team"
        ? process.env.STRIPE_PRICE_ID_TEAM || process.env.STRIPE_PRICE_ID_SUBSCRIPTION
        : process.env.STRIPE_PRICE_ID_SUBSCRIPTION
  } else {
    priceId = process.env.STRIPE_PRICE_ID_ONEOFF
  }

  if (!priceId) {
    throw new Error(
      "Missing Stripe price id — set STRIPE_PRICE_ID_SUBSCRIPTION (and optionally STRIPE_PRICE_ID_TEAM) or STRIPE_PRICE_ID_ONEOFF.",
    )
  }

  const billingTier = params.mode === "subscription" ? (params.tier ?? "pro") : "oneoff"

  const session = await stripe!.checkout.sessions.create({
    mode: params.mode === "subscription" ? "subscription" : "payment",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/settings?canceled=1`,
    customer_email: params.userEmail || undefined,
    metadata: {
      userId: params.userId,
      useMode: "server-proxy",
      billingMode: params.mode,
      billingTier,
    },
  })

  return session
}
