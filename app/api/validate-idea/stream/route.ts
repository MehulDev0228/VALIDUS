import { type NextRequest } from "next/server"
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

export const runtime = "nodejs"
export const maxDuration = 300

/** Server-Sent Events: progress phases + final JSON result (same payload shape as POST /api/validate-idea). */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const send = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    obj: Record<string, unknown>,
  ) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const idea_data = (body as { idea_data?: Partial<IdeaInput> })?.idea_data
  const fingerprint = ((body as { fingerprint?: string }).fingerprint ?? "").slice(0, 128) || null
  const userId = ((body as { user_id?: string }).user_id ?? "").slice(0, 128) || null

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Sign-in required.", code: "AUTH_REQUIRED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!idea_data) {
    return new Response(JSON.stringify({ success: false, error: "Missing idea_data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
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
    return new Response(
      JSON.stringify({ success: false, error: "Invalid idea input", details: parseResult.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const idea: IdeaInput = parseResult.data
  const ip = getClientIpFromRequest(request as any)
  const rateKey = buildRateLimitKey({ userId, ip, fingerprint })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const unlimited = await userHasUnlimitedMemos(userId)
        if (!unlimited) {
          if (!(await canConsumeFreeValidation(rateKey))) {
            send(controller, {
              type: "error",
              success: false,
              code: "RATE_LIMIT",
              error:
                "Daily limit reached (2 memo runs). Resets midnight UTC — tighten the brief and try tomorrow.",
            })
            controller.close()
            return
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
          send(controller, { type: "progress", phase: "cache", label: "Returning cached memo for identical brief" })
          send(controller, { type: "result", success: true, idea_id, validation_results: cachedResult })
          controller.close()
          return
        }

        send(controller, { type: "progress", phase: "start", label: "Starting validation pipeline" })

        const validation_results = await runFreeValidation(idea, {
          onProgress: (p) => send(controller, { type: "progress", ...p }),
        })

        setCachedFreeValidation(idea, validation_results)
        send(controller, { type: "result", success: true, idea_id, validation_results })
      } catch (e) {
        send(controller, {
          type: "error",
          success: false,
          error: e instanceof Error ? e.message : "Internal server error",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
