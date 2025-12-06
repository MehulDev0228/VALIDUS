"use client"

import { IdeaInput } from "@/lib/schemas/idea"
import { FullValidationResponse, FullValidationResponseSchema } from "@/lib/schemas/premium-validation"

export interface ClientLLMConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

async function callOpenAIChat(
  config: ClientLLMConfig,
  messages: ChatMessage[],
  responseFormat?: { type: "json_object" | "text" },
): Promise<any> {
  const baseUrl = config.baseUrl ?? "https://api.openai.com/v1"
  const model = config.model ?? "gpt-4o-mini"

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: responseFormat ?? { type: "json_object" },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`OpenAI error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return data

  try {
    return JSON.parse(content)
  } catch {
    return content
  }
}

function buildEvaluatorPrompt(idea: IdeaInput, evidenceSnippet: string): { system: string; user: string } {
  const system = `You are an expert startup evaluator. Output ONLY valid JSON matching schema:
{
 "classification":"high|possible|low|joke",
 "score": number,
 "summary": "short string",
 "topRisks": ["..."],
 "pivots":[{"title":"...", "why":"..."}],
 "comparables":[{"name":"...", "reason":"...", "url":"..."}],
 "tamSamSom":{"TAM":"$...","SAM":"$...","SOM":"$..."},
 "metadata":{"sources":["..."], "cached": boolean, "needsReview"?: boolean}
}
Use conservative wording; if data missing, put nulls and set metadata.needsReview=true.`

  const user = `Idea:
Title: ${idea.title}
Description: ${idea.description}
Industry: ${idea.industry ?? "unknown"}
Target market: ${idea.targetMarket ?? "unknown"}
Revenue model: ${idea.revenueModel ?? "unknown"}
Key features: ${(idea.keyFeatures ?? []).join(", ")}

Knowledge graph / market evidence:
${evidenceSnippet}

Task: produce JSON as in the schema above. Keep it concise but actionable.`

  return { system, user }
}

export async function runPremiumValidationClient(
  idea: IdeaInput,
  config: ClientLLMConfig,
): Promise<FullValidationResponse> {
  // For the MVP client flow, we run a single Evaluator-style agent that returns a rich JSON
  // and then map it into the FullValidationResponse shape with reasonable defaults.

  const evidenceSnippet = "(Client-side BYO-key evaluation; KG/scraper evidence wiring TBD.)"
  const { system, user } = buildEvaluatorPrompt(idea, evidenceSnippet)

  const raw = await callOpenAIChat(config, [
    { role: "system", content: system },
    { role: "user", content: user },
  ])

  // raw is expected to have the Evaluator schema from PROMPTS.md
  const classification = (raw.classification ?? "possible") as FullValidationResponse["classification"]
  const score = typeof raw.score === "number" ? raw.score : 7

  const summary: string = raw.summary ?? "Premium evaluation summary not available."

  const tamSamSom = {
    TAM: raw.tamSamSom?.TAM ?? "N/A",
    SAM: raw.tamSamSom?.SAM ?? "N/A",
    SOM: raw.tamSamSom?.SOM ?? "N/A",
    assumptions: ["Evaluator used heuristic market templates client-side."],
  }

  const swot = {
    strengths: raw.swot?.strengths ?? [],
    weaknesses: raw.swot?.weaknesses ?? [],
    opportunities: raw.swot?.opportunities ?? [],
    threats: raw.swot?.threats ?? [],
  }

  const competitorsDetailed = (raw.comparables ?? []).map((c: any) => ({
    name: c.name,
    marketShare: undefined,
    strengths: [c.reason ?? "similar positioning"],
    weaknesses: [],
    pricingNotes: undefined,
    url: c.url,
  }))

  const redFlags = (raw.redFlags ?? []).map((r: any, idx: number) => ({
    id: r.id ?? `rf_${idx}`,
    label: r.label ?? "Red flag",
    severity: (r.severity ?? "medium") as "low" | "medium" | "high",
    explanation: r.explanation ?? "",
    suggestedFix: r.suggestedFix,
  }))

  const gtmPlan = {
    usp: raw.usp ?? "Unique selling proposition to be refined.",
    businessModel: raw.businessModel ?? idea.revenueModel ?? "Business model TBD.",
    positioning: raw.positioning,
    pricingStrategy: raw.pricingStrategy,
    gtmSummary: raw.gtmSummary ?? summary,
  }

  const executionRoadmap = {
    days30: raw.executionRoadmap?.days30 ?? [],
    days60: raw.executionRoadmap?.days60 ?? [],
    days90: raw.executionRoadmap?.days90 ?? [],
    keyMetrics: raw.executionRoadmap?.keyMetrics ?? [],
    dataToCollect: raw.executionRoadmap?.dataToCollect ?? [],
  }

  const founderDNA = {
    overallScore: raw.founderDNA?.overallScore ?? 70,
    founderMarketFit: raw.founderDNA?.founderMarketFit ?? 65,
    ambition: raw.founderDNA?.ambition ?? 80,
    executionRisk: raw.founderDNA?.executionRisk ?? 60,
    clarityOfIdea: raw.founderDNA?.clarityOfIdea ?? 75,
    competitiveMoat: raw.founderDNA?.competitiveMoat ?? 55,
    notes: raw.founderDNA?.notes,
  }

  const investorAppeal = {
    overallScore: raw.investorAppeal?.overallScore ?? 70,
    marketTiming: raw.investorAppeal?.marketTiming ?? 75,
    tamRealism: raw.investorAppeal?.tamRealism ?? 70,
    monetizationStrength: raw.investorAppeal?.monetizationStrength ?? 60,
    defensibility: raw.investorAppeal?.defensibility ?? 55,
    distribution: raw.investorAppeal?.distribution ?? 50,
    notes: raw.investorAppeal?.notes,
  }

  const exportLinks = {
    pdfUrl: null,
    pitchOutlineUrl: null,
  }

  const provenance = {
    sources: (raw.metadata?.sources ?? []).map((s: any) => ({ label: String(s) })),
    cached: false,
    generatedAt: new Date().toISOString(),
  }

  const ideaId = raw.ideaId ?? `client_${Date.now()}`

  const candidate: FullValidationResponse = {
    ideaId,
    classification,
    viabilityScore: score,
    summary,
    tamSamSom,
    swot,
    competitorsDetailed,
    redFlags,
    gtmPlan,
    executionRoadmap,
    founderDNA,
    investorAppeal,
    exportLinks,
    provenance,
  }

  return FullValidationResponseSchema.parse(candidate)
}

export function getStoredOpenAIApiKey(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("fv_openai_api_key")
  } catch {
    return null
  }
}

export function storeOpenAIApiKey(key: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("fv_openai_api_key", key)
  } catch {
    // ignore
  }
}
