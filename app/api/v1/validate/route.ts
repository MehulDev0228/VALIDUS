import { type NextRequest, NextResponse } from "next/server"
import { IdeaInputSchema, type IdeaInput } from "@/lib/schemas/idea"
import { runFreeValidation } from "@/lib/agents/free-validator"
import { getCachedFreeValidation, setCachedFreeValidation } from "@/lib/cache"
import {
  canConsumeFreeValidation,
  recordFreeValidation,
  getClientIpFromRequest,
  buildRateLimitKey,
} from "@/lib/rate-limit"
import { userHasUnlimitedMemos } from "@/lib/services/billing"

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
}

/**
 * Machine API — Authorization: Bearer VERDIKT_API_KEY (server env).
 * Body matches POST /api/validate-idea (idea_data, user_id, fingerprint optional).
 */
export async function POST(request: NextRequest) {
  const expected = process.env.VERDIKT_API_KEY
  if (!expected) {
    return NextResponse.json(
      { success: false, error: "API access not configured", code: "API_DISABLED" },
      { status: 503 },
    )
  }

  const auth = request.headers.get("authorization")?.trim()
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null
  if (!token || token !== expected) return unauthorized()

  try {
    const body = await request.json()
    const idea_data = body?.idea_data as Partial<IdeaInput> | undefined
    const fingerprint = (body?.fingerprint as string | undefined)?.slice(0, 128) || null
    const userId = (body?.user_id as string | undefined)?.slice(0, 128) || null

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id required for ledger + limits", code: "BAD_REQUEST" },
        { status: 400 },
      )
    }

    if (!idea_data) {
      return NextResponse.json({ success: false, error: "Missing idea_data" }, { status: 400 })
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
        { success: false, error: "Invalid idea input", details: parseResult.error.flatten() },
        { status: 400 },
      )
    }

    const idea: IdeaInput = parseResult.data
    const ip = getClientIpFromRequest(request as any)
    const rateKey = buildRateLimitKey({ userId, ip, fingerprint })
    const unlimited = await userHasUnlimitedMemos(userId)
    if (!unlimited) {
      if (!(await canConsumeFreeValidation(rateKey))) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Daily limit reached (2 memo runs). Resets midnight UTC — tighten the brief and try tomorrow.",
            code: "RATE_LIMIT",
          },
          { status: 429 },
        )
      }
      await recordFreeValidation(rateKey)
    }

    const cached = getCachedFreeValidation(idea)
    const idea_id = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (cached) {
      const cachedResult = {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          generatedAt: new Date().toISOString(),
          degraded: cached.metadata?.degraded ?? false,
          degradedReason: cached.metadata?.degradedReason ?? null,
          enginePath: cached.metadata?.enginePath ?? "gemini_pipeline",
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
    console.error("/api/v1/validate error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
