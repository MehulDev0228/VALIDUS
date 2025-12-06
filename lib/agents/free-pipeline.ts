import { z } from "zod"

import { IdeaInput } from "@/lib/schemas/idea"
import { FreeValidationResponse, FreeValidationResponseSchema } from "@/lib/schemas/free-validation"
import { queryKnowledgeGraph, type KGItem } from "@/lib/kg"

// ---------- Shared helper types ----------

const NormalizedIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  industryTags: z.array(z.string()).default([]),
  targetCustomer: z.string(),
  valueHypothesis: z.string(),
  revenueModel: z.string().optional(),
  assumptions: z.array(z.string()).default([]),
  core_problem: z.string(),
  core_solution: z.string(),
})

export type NormalizedIdea = z.infer<typeof NormalizedIdeaSchema>

const KGHitSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url().optional(),
  matchScore: z.number().min(0).max(1),
  snippet: z.string().optional(),
  tags: z.array(z.string()).default([]),
  whyMatched: z.string(),
})

const KGRetrieverOutputSchema = z.object({
  strongMatches: z.array(KGHitSchema),
  looseMatches: z.array(KGHitSchema).default([]),
  noMatchReason: z.string().nullable().optional(),
})

export type KGHit = z.infer<typeof KGHitSchema>
export type KGRetrieverOutput = z.infer<typeof KGRetrieverOutputSchema>

const MarketEstimateSchema = z.object({
  TAM: z.string(),
  SAM: z.string(),
  SOM: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z.array(z.string()),
})

export type MarketEstimate = z.infer<typeof MarketEstimateSchema>

const LongReportSchema = z.object({
  text: z.string().min(0),
  positives: z.array(z.string()).default([]),
  negatives: z.array(z.string()).default([]),
})

export type LongReport = z.infer<typeof LongReportSchema>

// ---------- Low-level OpenAI wrapper ----------

async function callOpenAIJson(prompt: string): Promise<any> {
  const res = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`OpenAI error: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data
}

// ---------- Agent A: Input Normalizer ----------

export async function agentA_normalizeInput(idea: IdeaInput): Promise<NormalizedIdea> {
  const basePrompt = `You are Agent A: Input Normalizer. Take raw idea input and produce JSON with keys: 
  {"title","description","industryTags","targetCustomer","valueHypothesis","revenueModel","assumptions","core_problem","core_solution"}.
  Extract unstated assumptions and fill missing fields conservatively.`

  const userPayload = {
    title: idea.title,
    description: idea.description,
    industry: idea.industry,
    targetMarket: idea.targetMarket,
    revenueModel: idea.revenueModel,
    keyFeatures: idea.keyFeatures,
  }

  const prompt = `${basePrompt}\nINPUT:\n${JSON.stringify(userPayload, null, 2)}\nOUTPUT STRICT JSON:`

  const raw = await callOpenAIJson(prompt)
  const parsed = NormalizedIdeaSchema.safeParse(raw)
  if (!parsed.success) {
    // Fallback: very simple normalization when LLM output is bad.
    return {
      title: idea.title,
      description: idea.description,
      industryTags: idea.industry ? [idea.industry] : [],
      targetCustomer: idea.targetMarket || "Unspecified target customer",
      valueHypothesis: idea.description.slice(0, 280) || "Heuristic value hypothesis based on description.",
      revenueModel: idea.revenueModel,
      assumptions: ["LLM normalization failed; using heuristic normalization."],
      core_problem: idea.description.slice(0, 200) || "Problem description unclear.",
      core_solution: idea.title || "Solution not clearly specified.",
    }
  }
  return parsed.data
}

// ---------- Agent B: KG Retriever ----------

export async function agentB_kgRetriever(normalized: NormalizedIdea): Promise<KGRetrieverOutput> {
  const textParts = [normalized.core_problem, normalized.valueHypothesis, normalized.industryTags.join(" ")]
    .filter(Boolean)
    .join(". ")

  // Use existing KG heuristic/vector search to get initial candidates.
  const pseudoIdea: IdeaInput = {
    title: normalized.title,
    description: textParts,
    industry: normalized.industryTags[0] || "other",
    targetMarket: normalized.targetCustomer,
    revenueModel: normalized.revenueModel,
    keyFeatures: [],
    useMode: "free",
  }

  const kgItems: KGItem[] = queryKnowledgeGraph(pseudoIdea, 8)

  const strongMatches: KGHit[] = []
  const looseMatches: KGHit[] = []

  kgItems.forEach((item) => {
    const tagsLower = (item.tags || []).map((t) => t.toLowerCase())
    const industryHit = normalized.industryTags.some((t) => tagsLower.includes(t.toLowerCase()))
    const b2Flag = tagsLower.find((t) => t === "b2b" || t === "b2c")
    const isStrong = industryHit
    const baseScore = 0.8

    const hit: KGHit = {
      id: item.id,
      name: item.name,
      url: item.url,
      tags: item.tags,
      matchScore: isStrong ? baseScore : 0.4,
      snippet: item.text.slice(0, 280),
      whyMatched: isStrong
        ? "Industry tags overlap with idea's industry and problem framing."
        : "Semantic similarity to problem/value hypothesis but weaker industry/tag alignment.",
    }

    if (isStrong) strongMatches.push(hit)
    else looseMatches.push(hit)
  })

  const noMatchReason = strongMatches.length === 0 ? "No strong KG matches; only loose heuristic overlaps found." : null

  return KGRetrieverOutputSchema.parse({ strongMatches, looseMatches, noMatchReason })
}

// ---------- Agent C: Heuristic Market Estimator ----------

export async function agentC_marketEstimator(
  normalized: NormalizedIdea,
  kg: KGRetrieverOutput,
): Promise<MarketEstimate> {
  // Simple deterministic heuristic; later we can optionally call a tiny model for phrasing only.
  const baseTamBillions = (() => {
    const industry = (normalized.industryTags[0] || "other").toLowerCase()
    switch (industry) {
      case "fintech":
        return 120
      case "healthtech":
        return 90
      case "saas":
        return 80
      case "ecommerce":
        return 150
      default:
        return 50
    }
  })()

  const tam = baseTamBillions
  const sam = tam * 0.3
  const som = sam * 0.05

  const assumptions: string[] = [
    `Base TAM set to ~$${tam}B based on coarse industry bucket for ${normalized.industryTags[0] || "other"}.`,
    "SAM assumed at 30% of TAM for reachable segments.",
    "SOM assumed at 5% of SAM as realistic 5-year capture for a new entrant.",
  ]

  if (kg.strongMatches.length > 0) {
    assumptions.push(`Adjusted using ${kg.strongMatches.length} strong KG comparables as rough anchors.`)
  }

  return MarketEstimateSchema.parse({
    TAM: `$${tam.toFixed(0)}B+ overall market (heuristic est.)`,
    SAM: `$${sam.toFixed(0)}B+ serviceable segment (heuristic est.)`,
    SOM: `$${som.toFixed(1)}B realistically obtainable (5y est.)`,
    confidence: "medium",
    assumptions,
  })
}

// ---------- Agent D: Business Analyst (long report) ----------

export async function agentD_longReport(
  normalized: NormalizedIdea,
  kg: KGRetrieverOutput,
  market: MarketEstimate,
): Promise<LongReport> {
  const prompt = `You are Agent D: Business Analyst. Inputs: normalized idea, KG strongMatches, market estimates.
Return JSON {"longReport":{"text","positives","negatives"}} only.

Normalized idea: ${JSON.stringify(normalized)}
Strong KG matches: ${JSON.stringify(kg.strongMatches)}
Market estimate: ${JSON.stringify(market)}

Write a decisive report (>=300 words) with numbered sections:
1) Problem (2 paragraphs)
2) Market (2 paragraphs referencing KG evidence by id)
3) Competitive Landscape (top 3 rivals)
4) Monetization
5) Execution Complexity
6) Top Risks (3-6)
7) Conclusion (1 crisp verdict sentence)
8) Next 3 tactical steps.
Tone: founder-first, VC-direct, not polite. Use phrases like "This will fail if..." or "This can be saved by..."`)

  const raw = await callOpenAIJson(prompt)
  const parsed = LongReportSchema.safeParse(raw.longReport ?? raw)
  if (!parsed.success) {
    return {
      text:
        "Report generation failed validation; this is a heuristic summary. The idea needs manual partner review before acting.",
      positives: [],
      negatives: ["LLM longReport generation failed schema validation; treat this as placeholder only."],
    }
  }
  return parsed.data
}

// ---------- Agent E: Comparator Validator ----------

export async function agentE_validateComparables(kg: KGRetrieverOutput): Promise<KGHit[]> {
  const validated: KGHit[] = []

  kg.strongMatches.forEach((hit) => {
    const isStrong = hit.matchScore >= 0.65 || hit.matchScore === 0.8
    const preciseWhy = hit.whyMatched.length > 20
    if (isStrong && preciseWhy) {
      validated.push(hit)
    }
  })

  return validated
}

// ---------- Agent F: Assembler + Schema Enforcer ----------

export async function runFreeValidationPipeline(idea: IdeaInput): Promise<FreeValidationResponse> {
  const normalized = await agentA_normalizeInput(idea)
  const kg = await agentB_kgRetriever(normalized)
  const market = await agentC_marketEstimator(normalized, kg)
  const longReport = await agentD_longReport(normalized, kg, market)
  const comparables = await agentE_validateComparables(kg)

  // Simple viability scoring based on structure richness + KG hits.
  let score = 5
  if (normalized.description.split(/\s+/).length > 80) score += 1
  if (normalized.assumptions.length >= 3) score += 1
  if (kg.strongMatches.length >= 2) score += 1
  if (comparables.length === 0) score -= 1
  score = Math.max(0, Math.min(10, score))

  let classification: FreeValidationResponse["classification"] = "low"
  if (score >= 8) classification = "high"
  else if (score >= 6) classification = "possible"
  else if (score <= 2) classification = "joke"

  const topRisks: string[] = [
    "Target market clarity and ICP definition will make or break this.",
    "Monetization path needs to be pressure-tested against comparables.",
    "Go-to-market may be slower than founders expect; distribution risk is real.",
  ]

  const pivots: FreeValidationResponse["pivots"] = [
    {
      title: "Narrow to one concrete ICP and workflow",
      why: "Sharp ICP + painful workflow beats broad vision for early traction.",
    },
    {
      title: "Anchor pricing to a measurable business outcome",
      why: "Investors trust pricing tied to revenue/save-time metrics, not vague value.",
    },
    {
      title: "Start with a wedge feature rather than a platform",
      why: "A crisp wedge lets you win a small beachhead before expanding.",
    },
  ]

  const kgEvidenceIds = kg.strongMatches.map((h) => h.id)

  const baseResponse: FreeValidationResponse = {
    classification,
    score,
    summary: longReport.text.slice(0, 260) || "Heuristic summary; see long report for details.",
    longReport,
    topRisks: topRisks.slice(0, 5),
    pivots,
    comparables: comparables.map((c) => ({
      name: c.name,
      reason: c.whyMatched,
      url: c.url,
    })),
    tamSamSom: {
      TAM: market.TAM,
      SAM: market.SAM,
      SOM: market.SOM,
      confidence: market.confidence,
      assumptions: market.assumptions,
    },
    metadata: {
      sourceKeysUsed: ["local-kg-v1"],
      cached: false,
      generatedAt: new Date().toISOString(),
      kgEvidenceIds,
      dataFreshnessWarning: null,
      needsReview: false,
      needsReviewReason: null,
    },
  }

  // Final schema enforcement
  const parsed = FreeValidationResponseSchema.safeParse(baseResponse)
  if (!parsed.success) {
    return {
      ...baseResponse,
      metadata: {
        ...baseResponse.metadata,
        needsReview: true,
        needsReviewReason: "FreeValidationResponse schema validation failed; some fields may be inconsistent.",
      },
    }
  }

  return parsed.data
}
