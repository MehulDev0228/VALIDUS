import { type NextRequest, NextResponse } from "next/server"
import { IdeaInputSchema, type IdeaInput } from "@/lib/schemas/idea"
import { runFreeValidation } from "@/lib/agents/free-validator"
import { getCachedFreeValidation, setCachedFreeValidation } from "@/lib/cache"
import { canConsumeFreeValidation, recordFreeValidation, getClientIpFromRequest, buildRateLimitKey } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idea_data = body?.idea_data as Partial<IdeaInput> | undefined
    const fingerprint = (body?.fingerprint as string | undefined)?.slice(0, 128) || null

    if (!idea_data) {
      return NextResponse.json(
        { success: false, error: "Missing idea_data in request body" },
        { status: 400 },
      )
    }

    const parseResult = IdeaInputSchema.safeParse({
      title: idea_data.title,
      description: idea_data.description,
      industry: idea_data.industry,
      targetMarket: idea_data.targetMarket,
      revenueModel: idea_data.revenueModel,
      keyFeatures: idea_data.keyFeatures,
      useMode: idea_data.useMode ?? "free",
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

    // Rate limit: strict free validations per day using durable keying.
    const ip = getClientIpFromRequest(request as any)
    const rateKey = buildRateLimitKey(ip, fingerprint)
    if (!(await canConsumeFreeValidation(rateKey))) {
      return NextResponse.json(
        {
          success: false,
          error: "Daily limit reached (2 ideas/day). Try again tomorrow.",
        },
        { status: 429 },
      )
    }
    await recordFreeValidation(rateKey)

    // Cache by normalized idea hash for fast repeated runs.
    const cached = getCachedFreeValidation(idea)
    const idea_id = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (cached) {
      const cachedResult = {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          generatedAt: new Date().toISOString(),
        },
      }
      return NextResponse.json(
        {
          success: true,
          idea_id,
          validation_results: cachedResult,
        },
        { status: 200 },
      )
    }

    // For now, we only implement the free heuristic mode on this endpoint.
    // Premium modes will use a separate /api/premium/validate route.
    const freeResult = await runFreeValidation(idea)

    setCachedFreeValidation(idea, freeResult)

    return NextResponse.json(
      {
        success: true,
        idea_id,
        validation_results: freeResult,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("/api/validate-idea error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
