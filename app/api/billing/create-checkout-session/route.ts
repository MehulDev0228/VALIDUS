import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { createPremiumValidationCheckoutSession } from "@/lib/billing/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const mode = (body?.mode as "oneoff" | "subscription" | undefined) ?? "oneoff"

    const checkoutSession = await createPremiumValidationCheckoutSession({
      userId: session.user.id as string,
      userEmail: session.user.email,
      mode,
    })

    return NextResponse.json(
      {
        id: checkoutSession.id,
        url: checkoutSession.url,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("/api/billing/create-checkout-session error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
