import { generateGeminiJson } from "@/lib/llm/gemini-json"
import { isGeminiApiKeyPresent } from "@/lib/llm/gemini-status"
import type { IdeaInput } from "@/lib/schemas/idea"
import type { IndustryVertical } from "@/lib/intelligence/industry-types"

const VERTICALS: IndustryVertical[] = [
  "manufacturing_robotics",
  "healthcare",
  "fintech",
  "developer_tools",
  "ai_infrastructure",
  "saas",
  "marketplaces",
  "consumer_social",
  "enterprise_workflow",
  "logistics",
  "education",
  "creator_economy",
  "ecommerce",
  "smb_software",
  "industrial_infra",
  "climate_energy",
  "biotech",
  "deeptech",
  "cybersecurity",
]

function isIndustryVertical(s: unknown): s is IndustryVertical {
  return typeof s === "string" && (VERTICALS as string[]).includes(s)
}

/** Cheap Gemini JSON classification — combo ideas can set primary + secondary verticals. */
export async function tryGeminiIndustryClassification(idea: IdeaInput): Promise<{
  primaryVertical: IndustryVertical
  secondaryVertical: IndustryVertical | null
  confidence01: number
  rationale: string
} | null> {
  if (!isGeminiApiKeyPresent()) return null

  const prompt = `You are an expert at classifying startup ideas for internal routing (not investment advice).

Return ONLY valid JSON (no markdown) with this shape:
{
  "primaryVertical": "<one of the allowed values exactly>",
  "secondaryVertical": "<one of the allowed values or null if none>",
  "confidence01": <number 0.45-0.92>,
  "rationale": "<= 200 chars, why primary/secondary>"
}

Rules:
- If the idea spans two domains (e.g. fintech marketplace), set primary to the ECONOMIC engine and secondary to the GTM shape.
- Use "marketplaces" for two-sided / take-rate businesses.
- Use "ai_infrastructure" for model APIs, evals, GPU routing — not every app that mentions AI.
- Use "developer_tools" for devtools, SDKs, infra for engineers.
- "saas" is a fallback when it is generic B2B software without a clearer vertical.

Allowed primaryVertical and secondaryVertical values (exact strings):
${VERTICALS.join(", ")}

Idea:
title: ${JSON.stringify(idea.title)}
description: ${JSON.stringify(idea.description)}
industry (founder-supplied): ${JSON.stringify(idea.industry ?? "")}
targetMarket: ${JSON.stringify(idea.targetMarket ?? "")}
revenueModel: ${JSON.stringify(idea.revenueModel ?? "")}
`

  try {
    const j = await generateGeminiJson(prompt)
    const primary = j?.primaryVertical
    const secondary = j?.secondaryVertical
    const confidence01 = typeof j?.confidence01 === "number" ? j.confidence01 : 0.62
    const rationale = typeof j?.rationale === "string" ? j.rationale.slice(0, 240) : "gemini"

    if (!isIndustryVertical(primary)) return null
    let sec =
      secondary === null || secondary === undefined
        ? null
        : isIndustryVertical(secondary)
          ? secondary
          : null
    if (sec === primary) sec = null

    return {
      primaryVertical: primary,
      secondaryVertical: sec,
      confidence01: Math.min(0.92, Math.max(0.45, confidence01)),
      rationale,
    }
  } catch {
    return null
  }
}
