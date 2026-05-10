import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { IdeaInputSchema } from "@/lib/schemas/idea"
import { generateGeminiJson } from "@/lib/llm/gemini-json"
import { isGeminiApiKeyPresent } from "@/lib/llm/gemini-status"
import { buildDeterministicIterateRefinement } from "@/lib/founder/iterate-deterministic"

const AttemptSchema = z.object({
  actionTaken: z.string(),
  result: z.string(),
  learnings: z.string(),
})

const BodySchema = z.object({
  idea: IdeaInputSchema,
  lastValidation: z.record(z.unknown()).optional(),
  attempts: z.array(AttemptSchema).default([]),
})

function collectWeaknesses(lv: Record<string, unknown> | undefined): string[] {
  if (!lv || typeof lv !== "object") return []
  const weaknesses: string[] = []
  const fr = lv.finalVerdict as Record<string, unknown> | undefined
  if (fr?.topReasons) weaknesses.push(...((fr.topReasons as string[]) ?? []).slice(0, 5))
  if (fr?.topRisks) weaknesses.push(...((fr.topRisks as string[]) ?? []).slice(0, 5))
  const wf = lv.whyThisIdeaWillLikelyFail as string[] | undefined
  if (wf) weaknesses.push(...wf.slice(0, 5))
  const kr = lv.keyRisks as string[] | undefined
  if (kr) weaknesses.push(...kr.slice(0, 3))
  const risks = lv.topRisks as string[] | undefined
  if (risks) weaknesses.push(...risks.slice(0, 5))
  return Array.from(new Set(weaknesses.map((s) => String(s).trim()).filter(Boolean))).slice(0, 12)
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
    }
    const { idea, lastValidation, attempts } = parsed.data
    const lv = lastValidation as Record<string, unknown> | undefined

    const weaker = collectWeaknesses(lv)

    const prompt = `You are the VERDIKT Iteration Engine.
Goal: Produce the next sharper version of the startup thesis so the founder can DECIDE faster and VALIDATE honestly.

Return STRICT JSON only:
{
  "title": string,
  "description": string,
  "targetMarket": string,
  "industry": string,
  "revenueModel": string,
  "keyFeatures": string[],
  "keyChanges": string[],
  "whyChanged": string[]
}

Rules:
- Opinionated and direct; no clichés.
- Explicitly dismantle weaknesses below; rewrite until each is either fixed in the pitch or surfaced as explicit risk to test.
- Use validation logs: if founders saw real-market signal, amplify it into positioning; if they saw rejection, tighten wedge or buyer.
- keyChanges MUST map 1-to-1 to concrete edits versus the previous submission.
- whyChanged MUST explain ruthless reasoning behind each rewrite (voice: partner meeting, not blog post).
- Keep keyFeatures 3–6 items.

Structured weaknesses to attack:
${JSON.stringify(weaker.length ? weaker : ["No weaknesses extracted"], null, 2)}

Current idea:
${JSON.stringify(idea, null, 2)}

Last validation blob (signals + judge):
${JSON.stringify(lastValidation ?? {}, null, 0)}

Validation log entries (truth from the founder):
${JSON.stringify(attempts, null, 2)}`

    let degraded = false

    if (!isGeminiApiKeyPresent()) {
      const refined = buildDeterministicIterateRefinement(idea, lv, attempts)
      return NextResponse.json({
        success: true,
        refined,
        degraded: true,
        degradedReason: "GEMINI_API_KEY not set — merged memo + logs locally.",
      })
    }

    try {
      const out = await generateGeminiJson(prompt)
      const title = String(out?.title || idea.title).slice(0, 200)
      const description = String(out?.description || idea.description).slice(0, 8000)
      const targetMarket = String(out?.targetMarket || idea.targetMarket || "").slice(0, 2000)
      const industry = String(out?.industry || idea.industry || "other").slice(0, 80)
      const revenueModel = String(out?.revenueModel || idea.revenueModel || "other").slice(0, 80)
      const keyFeatures = Array.isArray(out?.keyFeatures)
        ? out.keyFeatures.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 8)
        : idea.keyFeatures || []

      return NextResponse.json({
        success: true,
        refined: {
          title,
          description,
          industry,
          targetMarket,
          revenueModel,
          keyFeatures,
          keyChanges: Array.isArray(out?.keyChanges) ? out.keyChanges.map((x: unknown) => String(x)) : [],
          whyChanged: Array.isArray(out?.whyChanged) ? out.whyChanged.map((x: unknown) => String(x)) : [],
        },
        degraded: false,
      })
    } catch (e) {
      console.warn("/api/founder/iterate Gemini failed, using deterministic merge:", e)
      degraded = true
      const refined = buildDeterministicIterateRefinement(idea, lv, attempts)
      return NextResponse.json({
        success: true,
        refined,
        degraded,
        degradedReason: "Model call failed — merged memo + logs locally instead.",
      })
    }
  } catch (e) {
    console.error("/api/founder/iterate", e)
    return NextResponse.json({ success: false, error: "Iteration failed" }, { status: 500 })
  }
}
