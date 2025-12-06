import { type NextRequest, NextResponse } from "next/server"
import { IdeaInputSchema, type IdeaInput } from "@/lib/schemas/idea"
import { runPremiumValidationServer } from "@/lib/agents/premium-server"
import { getCachedPremiumValidation, setCachedPremiumValidation } from "@/lib/cache"
import { canConsumePremiumServerRun, recordPremiumServerRun } from "@/lib/premium-quota"
import { getAuthSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const idea_data = body?.idea_data as Partial<IdeaInput> | undefined
    const billingToken = body?.billingToken as string | undefined

    // Require auth for premium validations (server-proxy mode).
    const session = await getAuthSession()
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!idea_data) {
      return NextResponse.json(
        { success: false, error: "Missing idea_data in request body" },
        { status: 400 },
      )
    }

    // TODO: enforce auth + real billing token verification (Stripe).
    if (!billingToken) {
      return NextResponse.json(
        { success: false, error: "Billing token is required for premium validation" },
        { status: 402 },
      )
    }

    const parseResult = IdeaInputSchema.safeParse({
      title: idea_data.title,
      description: idea_data.description,
      industry: idea_data.industry,
      targetMarket: idea_data.targetMarket,
      revenueModel: idea_data.revenueModel,
      keyFeatures: idea_data.keyFeatures,
      useMode: idea_data.useMode ?? "server-proxy",
    })

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid idea input",
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      )
    }

    const idea: IdeaInput = parseResult.data
    const idea_id = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Global quota for subsidized premium server runs.
    if (!canConsumePremiumServerRun()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Premium server capacity is temporarily limited. Please try again later or use the browser-based BYO-key flow.",
        },
        { status: 429 },
      )
    }

    // Cache premium responses by normalized idea; in production this should be backed by a shared store.
    const cached = getCachedPremiumValidation(idea)
    if (cached) {
      return NextResponse.json(
        {
          success: true,
          idea_id,
          validation_results: cached,
        },
        { status: 200 },
      )
    }

    const fullResult = await runPremiumValidationServer(idea, idea_id)
    setCachedPremiumValidation(idea, fullResult)
    recordPremiumServerRun()

    return NextResponse.json(
      {
        success: true,
        idea_id,
        validation_results: fullResult,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("/api/premium/validate error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
