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
}

export async function createPremiumValidationCheckoutSession(params: CreateCheckoutParams) {
  assertStripeConfigured()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const priceId =
    params.mode === "subscription"
      ? process.env.STRIPE_PRICE_ID_SUBSCRIPTION
      : process.env.STRIPE_PRICE_ID_ONEOFF

  if (!priceId) {
    throw new Error("Missing STRIPE_PRICE_ID_ONEOFF or STRIPE_PRICE_ID_SUBSCRIPTION for checkout session.")
  }

  const session = await stripe!.checkout.sessions.create({
    mode: params.mode === "subscription" ? "subscription" : "payment",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
    customer_email: params.userEmail || undefined,
    metadata: {
      userId: params.userId,
      useMode: "server-proxy",
      billingMode: params.mode,
    },
  })

  return session
}
