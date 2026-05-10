import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { createPremiumValidationCheckoutSession } from "@/lib/billing/stripe"

export async function POST(request: Request) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 })
  }

  let mode: "oneoff" | "subscription" = "subscription"
  let tier: "pro" | "team" | undefined
  try {
    const body = await request.json()
    if (body?.mode === "oneoff" || body?.mode === "subscription") mode = body.mode
    if (body?.tier === "team" || body?.tier === "pro") tier = body.tier
  } catch {
    /* default subscription */
  }

  try {
    const checkout = await createPremiumValidationCheckoutSession({
      userId: uid,
      userEmail: session?.user?.email,
      mode,
      tier,
    })
    return NextResponse.json({ url: checkout.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
