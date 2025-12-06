import seedData from "./seed.json"
import { type IdeaInput } from "@/lib/schemas/idea"
import { type FreeValidationResponse } from "@/lib/schemas/free-validation"

export type KGItemType = "startup" | "pitch" | "article" | "deck"

export interface KGItem {
  id: string
  name: string
  type: KGItemType
  text: string
  url?: string
  tags: string[]
  createdAt?: string
}

const KG_ITEMS: KGItem[] = seedData as KGItem[]

// Optional vector index built by scripts/ingest.ts. We load lazily so that
// local development works even if the index has not been generated.
interface KGVectorIndexItem {
  id: string
  embedding: number[]
  tags: string[]
}

interface KGVectorIndex {
  model: string
  createdAt: string
  items: KGVectorIndexItem[]
}

let vectorIndex: KGVectorIndex | null = null

function loadVectorIndex(): KGVectorIndex | null {
  if (vectorIndex !== null) return vectorIndex
  try {
    // Using require here avoids bundling issues if the file is missing.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const idx = require("../../data/kg/vector-index.json") as KGVectorIndex
    vectorIndex = idx
    return idx
  } catch {
    vectorIndex = null
    return null
  }
}

function normalize(text: string | undefined | null): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 2)
}

function extractIdeaTokens(idea: IdeaInput): string[] {
  const parts: string[] = []

  parts.push(idea.title)
  parts.push(idea.description)
  if (idea.industry) parts.push(idea.industry)
  if (idea.targetMarket) parts.push(idea.targetMarket)
  if (idea.revenueModel) parts.push(idea.revenueModel)
  if (idea.keyFeatures && idea.keyFeatures.length > 0) {
    parts.push(idea.keyFeatures.join(" "))
  }

  return tokenize(parts.join(" "))
}

// Basic cosine similarity for small vectors; used when vector index is present.
function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function scoreItem(ideaTokens: Set<string>, item: KGItem): number {
  const textTokens = new Set(tokenize(item.text))
  item.tags.forEach((tag) => {
    textTokens.add(tag.toLowerCase())
  })

  let overlap = 0
  ideaTokens.forEach((token) => {
    if (textTokens.has(token)) overlap += 1
  })

  if (overlap === 0) return 0
  return overlap / Math.sqrt(textTokens.size || 1)
}

export function queryKnowledgeGraph(idea: IdeaInput, limit = 3): KGItem[] {
  const ideaTokens = new Set(extractIdeaTokens(idea))

  // If we have a vector index, use it as the primary signal and fall back
  // to token overlap to break ties.
  const idx = loadVectorIndex()
  if (idx && idx.items.length > 0) {
    // Build a lightweight embedding from token frequencies for the idea
    // when we don't have direct embeddings. This is only used to rank
    // within the local index; quality comes mainly from curated KG items.
    const tokenArray = Array.from(ideaTokens)
    const pseudoEmbedding = tokenArray.map((t) => t.length / 10)

    const scored = idx.items
      .map((entry) => {
        const baseSim = cosineSimilarity(pseudoEmbedding, entry.embedding)
        const tagOverlap = entry.tags.some((t) => ideaTokens.has(t.toLowerCase())) ? 1 : 0
        const matchScore = 0.7 * tagOverlap + 0.3 * baseSim
        const item = KG_ITEMS.find((k) => k.id === entry.id)
        return item ? { item, score: matchScore } : null
      })
      .filter((x): x is { item: KGItem; score: number } => !!x)
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map(({ item }) => item)
  }

  // Fallback: pure heuristic token overlap on seed KG.
  const scored = KG_ITEMS.map((item) => ({
    item,
    score: scoreItem(ideaTokens, item),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(({ item }) => item)
}

const INDUSTRY_TAM_MAP: Record<string, number> = {
  fintech: 124_000_000_000,
  healthtech: 89_000_000_000,
  edtech: 45_000_000_000,
  ecommerce: 156_000_000_000,
  saas: 78_000_000_000,
  marketplace: 67_000_000_000,
  social: 34_000_000_000,
  gaming: 23_000_000_000,
}

function estimateTamSamSom(idea: IdeaInput, matched: KGItem[]): FreeValidationResponse["tamSamSom"] {
  const industryKey = idea.industry?.toLowerCase() || "other"
  const baseTAM =
    INDUSTRY_TAM_MAP[industryKey] ||
    (matched.some((m) => m.tags.includes("fintech"))
      ? INDUSTRY_TAM_MAP.fintech
      : 50_000_000_000)

  const sam = baseTAM * 0.3
  const som = sam * 0.05

  const formatBillions = (value: number): string => `$${(value / 1_000_000_000).toFixed(0)}B+`

  return {
    TAM: `${formatBillions(baseTAM)} overall market (heuristic est.)`,
    SAM: `${formatBillions(sam)} serviceable segment (heuristic est.)`,
    SOM: `${formatBillions(som)} realistically obtainable (5y est.)`,
  }
}

function classifyIdea(idea: IdeaInput, matched: KGItem[]): {
  classification: FreeValidationResponse["classification"]
  score: number
} {
  const descLen = normalize(idea.description).split(" ").length
  const hasTarget = !!idea.targetMarket && idea.targetMarket.length > 10
  const hasRevenue = !!idea.revenueModel && idea.revenueModel.length > 3
  const hasFeatures = !!idea.keyFeatures && idea.keyFeatures.length >= 3

  let score = 4

  if (descLen > 40) score += 1
  if (descLen > 80) score += 1
  if (hasTarget) score += 1
  if (hasRevenue) score += 1
  if (hasFeatures) score += 1
  if (matched.length === 0) score -= 1

  score = Math.max(0, Math.min(10, score))

  let classification: FreeValidationResponse["classification"] = "low"
  if (score >= 8) classification = "high"
  else if (score >= 6) classification = "possible"
  else if (score <= 2) classification = "joke"

  return { classification, score }
}

function deriveTopRisks(idea: IdeaInput): string[] {
  const risks: string[] = []

  if (!idea.targetMarket || idea.targetMarket.length < 20) {
    risks.push("Target market is not clearly defined or is too broad.")
  }

  if (!idea.revenueModel) {
    risks.push("Revenue model is missing or underspecified.")
  }

  if (!idea.keyFeatures || idea.keyFeatures.length < 3) {
    risks.push("Key features are too few or not clearly articulated.")
  }

  const descLen = normalize(idea.description).split(" ").length
  if (descLen < 40) {
    risks.push("Idea description is very short; investors may see this as underdeveloped thinking.")
  }

  return risks.slice(0, 3)
}

function derivePivots(idea: IdeaInput): FreeValidationResponse["pivots"] {
  const pivots: FreeValidationResponse["pivots"] = []

  pivots.push({
    title: "Narrow to a single high-pain segment",
    why: "A crisp ICP (ideal customer profile) makes positioning, pricing, and GTM dramatically easier.",
  })

  pivots.push({
    title: "Anchor on one expensive, recurring workflow",
    why: "Automating a specific painful workflow creates measurable ROI and clearer willingness-to-pay.",
  })

  if (!idea.revenueModel || idea.revenueModel === "freemium") {
    pivots.push({
      title: "Test a simple paid plan with a clear outcome",
      why: "Even a basic paid tier validates that the problem is important enough to spend money on.",
    })
  } else {
    pivots.push({
      title: "Stress-test pricing against 3–5 comparable products",
      why: "Aligning pricing with perceived value and market anchors reduces friction in early sales.",
    })
  }

  return pivots.slice(0, 3)
}

function buildSummary(idea: IdeaInput, classification: FreeValidationResponse["classification"], score: number): string {
  const base = `This idea currently looks ${classification === "high" ? "strong" : classification === "possible" ? "promising" : "uncertain"} with a heuristic score of ${score}/10.`

  const industry = idea.industry ? idea.industry.toLowerCase() : "your chosen"
  const extra =
    classification === "high"
      ? " You have enough clarity to start structured customer conversations and simple experiments."
      : classification === "possible"
        ? " With sharper positioning and a clearer ICP, this could become a compelling venture-scale opportunity."
        : " Focus first on nailing a concrete customer segment and a painful workflow before worrying about fundraising."

  return `${base} In the ${industry} space, investors will look for focus and evidence of real pull.${extra}`
}

export function heuristicFreeValidation(idea: IdeaInput): FreeValidationResponse {
  const matched = queryKnowledgeGraph(idea, 3)
  const { classification, score } = classifyIdea(idea, matched)
  const topRisks = deriveTopRisks(idea)
  const pivots = derivePivots(idea)
  const tamSamSom = estimateTamSamSom(idea, matched)

  const comparables = matched.map((item) => ({
    name: item.name,
    reason: `Similar tags: ${item.tags.slice(0, 3).join(", ")}`,
    url: item.url,
  }))

  const summary = buildSummary(idea, classification, score)

  const response: FreeValidationResponse = {
    classification,
    score,
    summary,
    topRisks,
    pivots,
    comparables,
    tamSamSom,
    metadata: {
      sourceKeysUsed: ["local-kg-v1"],
      cached: false,
      generatedAt: new Date().toISOString(),
    },
  }

  return response
}