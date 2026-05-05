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

export function getKGItemById(id: string): KGItem | undefined {
  return KG_ITEMS.find((item) => item.id === id)
}

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

function containsAny(text: string, candidates: string[]): boolean {
  const norm = normalize(text)
  return candidates.some((c) => norm.includes(c))
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

type DomainKey = "india-b2b-fintech" | "generic"

interface DomainContext {
  key: DomainKey
  region: string | null
  businessModelTags: string[]
}

function inferDomainContext(idea: IdeaInput, matched: KGItem[]): DomainContext {
  const tokens = new Set(extractIdeaTokens(idea))
  const fullText = `${idea.title} ${idea.description} ${idea.targetMarket || ""} ${idea.industry || ""}`
  const hasIndia = containsAny(fullText, ["india", "indian", "bharat"])
  const hasB2B = containsAny(fullText, ["b2b", "vendor", "vendors", "msme", "sme", "supplier", "suppliers"])
  const hasPayments = containsAny(fullText, ["payment", "payments", "payable", "payables", "invoice", "invoices"])
  const hasCredit = containsAny(fullText, ["credit", "lending", "loan", "nbfc"])
  const kgFintech = matched.some((m) => m.tags.map((t) => t.toLowerCase()).some((t) => ["fintech", "payments", "credit"].includes(t)))

  if (hasIndia && hasB2B && (hasPayments || hasCredit || kgFintech)) {
    return {
      key: "india-b2b-fintech",
      region: "india",
      businessModelTags: ["b2b", "fintech", "credit", "payments"],
    }
  }

  return {
    key: "generic",
    region: null,
    businessModelTags: [],
  }
}

function estimateTamSamSom(
  idea: IdeaInput,
  matched: KGItem[],
  domain: DomainContext,
): FreeValidationResponse["tamSamSom"] {
  // Domain-specialised path for India B2B payments / credit grid.
  if (domain.key === "india-b2b-fintech") {
    // These are rough, clearly-marked heuristics – not real market research.
    const tamBillions = 250 // heuristic: value of annual B2B invoice volume touching MSMEs + mid/large buyers.
    const samBillions = tamBillions * 0.35
    const somBillions = samBillions * 0.08

    const TAM = `Heuristic TAM: value of B2B invoices issued between Indian MSMEs / SMEs and mid–large buyers (~$${tamBillions.toFixed(0)}B+/year).`
    const SAM = `SAM: flows in verticals where delayed payments are systemic (logistics, manufacturing, construction) (~$${samBillions.toFixed(0)}B+/year).`
    const SOM = `SOM: portion of those flows you could realistically score or influence in 5 years via partners (ERPs, banks, marketplaces) (~$${somBillions.toFixed(1)}B+/year).`

    const assumptions = [
      "Assumes tens of millions of MSMEs/SMEs in India, with a large minority already using digital invoicing/accounting.",
      "Assumes 30–40% of B2B payment volume is in sectors where delayed payments are structurally severe.",
      "Assumes the platform can touch 5–10% of those flows through integrations with ERPs, banks, and marketplaces.",
    ]

    return {
      TAM,
      SAM,
      SOM,
      confidence: "medium",
      assumptions,
    }
  }

  // Generic fallback using coarse industry buckets.
  const industryKey = idea.industry?.toLowerCase() || "other"
  const baseTAM =
    INDUSTRY_TAM_MAP[industryKey] ||
    (matched.some((m) => m.tags.includes("fintech"))
      ? INDUSTRY_TAM_MAP.fintech
      : 50_000_000_000)

  const sam = baseTAM * 0.3
  const som = sam * 0.05

  const formatBillions = (value: number): string => `$${(value / 1_000_000_000).toFixed(0)}B+`

  const assumptions: string[] = [
    `TAM inferred from coarse industry bucket for ${idea.industry || "other"}.`,
    "SAM assumed at ~30% of TAM for reachable segments.",
    "SOM assumed at ~5% of SAM as a 5-year capture for a new entrant.",
  ]

  return {
    TAM: `${formatBillions(baseTAM)} overall market (heuristic est.)`,
    SAM: `${formatBillions(sam)} serviceable segment (heuristic est.)`,
    SOM: `${formatBillions(som)} realistically obtainable (5y est.)`,
    confidence: "low",
    assumptions,
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

function deriveTopRisks(idea: IdeaInput, domain: DomainContext): string[] {
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

  // Domain-specific risk overlays.
  if (domain.key === "india-b2b-fintech") {
    risks.push(
      "Data access & integrations: permissioned access to invoice/payment data from ERPs, GST systems, and email inboxes is slow and requires deep integrations.",
    )
    risks.push(
      "Trust & liability: mis-scoring a large buyer's payment behaviour can create legal and commercial fallout; you will need strong dispute and appeals mechanisms.",
    )
    risks.push(
      "Two-sided bootstrapping: SMEs only care if buyers and lenders care, and buyers care only if SMEs or lenders act on the score; bootstrapping both sides in India is non-trivial.",
    )
  }

  const unique = Array.from(new Set(risks))
  if (unique.length === 0) {
    unique.push("Risks are not explicitly articulated yet; the biggest risk is building for months without talking to real customers.")
  }

  return unique.slice(0, 5)
}

function derivePivots(idea: IdeaInput, domain: DomainContext): FreeValidationResponse["pivots"] {
  const pivots: FreeValidationResponse["pivots"] = []

  if (domain.key === "india-b2b-fintech") {
    pivots.push({
      title: "Start as vendor-side analytics SaaS in one vertical",
      why: "Segment focus: Indian MSME vendors in a single high-friction vertical (e.g., logistics). Product wedge: a dashboard that ranks buyers by payment behaviour from invoices/email. Distribution bet: partner with accountants and Tally-like providers already serving those vendors.",
    })
    pivots.push({
      title: "Make Payment Behaviour Score a credit signal for lenders first",
      why: "Segment focus: NBFCs and banks doing working-capital lending to SMEs. Product wedge: a simple PBS API they can plug into underwriting. Distribution bet: co-sell with one or two lending partners instead of trying to build a marketplace on day one.",
    })
    pivots.push({
      title: "Launch in one notorious late-payment supply chain",
      why: "Segment focus: a vertical like manufacturing or construction where one or two anchors control thousands of vendors. Product wedge: get one anchor to enforce invoice-upload and PBS as a procurement rule. Distribution bet: win the anchor and let them drag their vendor base onto the grid.",
    })
  } else {
    pivots.push({
      title: "Pick one painfully specific ICP and workflow",
      why: "Segment focus: a single buyer persona and use case. Product wedge: one workflow you can own. Distribution bet: the one channel (community, integration partner, marketplace) that gets you in front of them cheaply.",
    })

    pivots.push({
      title: "Turn the idea into a must-have tool for a narrow power user",
      why: "Segment focus: the team that feels the pain every day (ops, finance, sales). Product wedge: the report or alert they would hate to lose. Distribution bet: land with that team, then expand.",
    })

    if (!idea.revenueModel || idea.revenueModel === "freemium") {
      pivots.push({
        title: "Test a blunt, paid version of the product",
        why: "Segment focus: 5–10 design partners. Product wedge: a hand-held version of your core promise, even if manual. Distribution bet: founder-led sales to get real pricing signals.",
      })
    } else {
      pivots.push({
        title: "Stress-test pricing against 3–5 real alternatives",
        why: "Segment focus: buyers currently paying for adjacent tools. Product wedge: show where you replace or consolidate spend. Distribution bet: sell into existing budget lines instead of inventing a new one.",
      })
    }
  }

  return pivots.slice(0, 3)
}

function buildSummary(
  idea: IdeaInput,
  classification: FreeValidationResponse["classification"],
  score: number,
  domain: DomainContext,
): string {
  const base = `This idea currently looks ${
    classification === "high" ? "strong" : classification === "possible" ? "promising" : "uncertain"
  } with a heuristic score of ${score}/10.`

  if (domain.key === "india-b2b-fintech") {
    return (
      `${base} In the India B2B payments and vendor-credit ecosystem, almost all of the difficulty is data access, incentives, and go-to-market, not building a scoring model.` +
      " You should treat this as infrastructure: slow to start but potentially compounding once you wedge into one supply chain."
    )
  }

  const industry = idea.industry ? idea.industry.toLowerCase() : "your chosen"
  const extra =
    classification === "high"
      ? " You have enough clarity to start structured customer conversations and simple experiments."
      : classification === "possible"
        ? " With sharper positioning and a clearer ICP, this could become a compelling venture-scale opportunity."
        : " Focus first on nailing a concrete customer segment and a painful workflow before worrying about fundraising."

  return `${base} In the ${industry} space, investors will look for focus and evidence of real pull.${extra}`
}

function buildLongReport(
  idea: IdeaInput,
  classification: FreeValidationResponse["classification"],
  score: number,
  domain: DomainContext,
  topRisks: string[],
  pivots: FreeValidationResponse["pivots"],
  tamSamSom: FreeValidationResponse["tamSamSom"],
  comparables: FreeValidationResponse["comparables"],
): FreeValidationResponse["longReport"] {
  const positives: string[] = []
  const negatives: string[] = [...topRisks]

  if (domain.key === "india-b2b-fintech") {
    positives.push(
      "Huge underlying market of Indian MSMEs and mid–large buyers where delayed payments are systemic; if you crack data access and incentives, this can become part of the financial plumbing.",
    )
    positives.push(
      "The Payment Behaviour Score can become a reusable signal for lenders, marketplaces, and ERPs if you prove it in one wedge vertical.",
    )

    const lines: string[] = []
    lines.push(
      `High-level read: This is a system-level idea in India B2B payments with real category-defining potential. The hard part is not the scoring math but persuading large buyers and their vendors to expose invoice and payment data in a way that regulators, banks, and procurement teams can live with.`,
    )
    lines.push(
      `Market & structure: India has millions of MSMEs and SMEs that live and die on working capital. Vendor payments are routinely delayed, and there is no shared, neutral layer that makes B2B payment behaviour visible. You are effectively proposing a "CIBIL for vendor payments" rather than yet another SaaS dashboard. ${tamSamSom.TAM || ""}`,
    )
    if (comparables.length > 0) {
      lines.push(
        `Analogues: Think of business credit bureaus (CIBIL/Experian), Dun & Bradstreet-style information providers, and platforms like Taulia/C2FO that use invoice data to change how cash moves. You are closest to those, not a generic SaaS tool.`,
      )
    }
    lines.push(
      "Execution & data access: 90% of the risk is in integrations and permissions. You will need to get ERP data, GST/tax data, or bank/payment-rail data flowing under clear consent, plus a dispute process for buyers who claim your score is wrong.",
    )
    lines.push(
      "Go-to-market: The most credible path is to win one vertical and one anchor, then use them as the enforcement mechanism that drags a whole vendor network onto the grid. Until you have a live wedge, this is just a nice deck.",
    )

    return {
      text: lines.join("\n\n"),
      positives,
      negatives,
    }
  }

  positives.push("Idea is coherent enough to run concrete customer interviews and simple experiments.")
  const genericLines: string[] = []
  genericLines.push(
    `High-level read: This looks ${classification} with a heuristic score of ${score}/10. You are in ${
      idea.industry || "a generic"
    } market; the outcome now depends more on focus and GTM than raw idea novelty.`,
  )
  genericLines.push(
    `Market: ${tamSamSom.TAM || "TAM is estimated heuristically"}. Treat this as a sanity check, not gospel; your real job is to find a narrow ICP who feels a sharp pain and can pay.`,
  )
  if (comparables.length > 0) {
    genericLines.push(
      `Comparables: The KG suggests a few adjacent products (${comparables
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ")}). Study how they acquired early users and priced; copy the parts that map to your segment.`,
    )
  }

  return {
    text: genericLines.join("\n\n"),
    positives,
    negatives,
  }
}

export function heuristicFreeValidation(idea: IdeaInput): FreeValidationResponse {
  const matched = queryKnowledgeGraph(idea, 8)
  const domain = inferDomainContext(idea, matched)
  const { classification, score } = classifyIdea(idea, matched)
  const tamSamSom = estimateTamSamSom(idea, matched, domain)
  const topRisks = deriveTopRisks(idea, domain)
  const pivots = derivePivots(idea, domain)

  // Heuristic score breakdown for explainability.
  const descLen = normalize(idea.description).split(" ").length
  const marketScore = Math.min(10, Math.max(0, tamSamSom.TAM ? 7 : 4))
  const competitionScore = Math.min(10, Math.max(0, matched.length >= 2 ? 7 : 5))
  const monetizationScore = idea.revenueModel ? 7 : 3
  const executionScore = descLen > 80 && idea.keyFeatures && idea.keyFeatures.length >= 3 ? 7 : 4
  const founderFitScore = idea.targetMarket && idea.targetMarket.length > 40 ? 7 : 4

  const weights = {
    market: 0.25,
    competition: 0.2,
    monetization: 0.2,
    execution: 0.2,
    founderFit: 0.15,
  }

  const driversUp: string[] = []
  const driversDown: string[] = []

  const pushDriver = (dimension: string, direction: "up" | "down", text: string) => {
    const label = `${dimension}: ${text}`
    if (direction === "up") driversUp.push(label)
    else driversDown.push(label)
  }

  if (domain.key === "india-b2b-fintech") {
    // Market drivers
    pushDriver(
      "Market",
      "up",
      "Huge base of MSME/SME vendors in India; chronic delayed payments create a real, systemic pain.",
    )
    if (marketScore < 9) {
      pushDriver(
        "Market",
        "down",
        "Adoption friction among large enterprises and corporates; many will resist exposing payment behaviour.",
      )
    }

    // Competition drivers
    pushDriver(
      "Competition",
      "up",
      "There is no obvious, neutral 'payment trust grid' today; whitespace between ERPs, banks, and bureaus.",
    )
    if (competitionScore < 9) {
      pushDriver(
        "Competition",
        "down",
        "Banks, TReDS platforms, ERPs, and credit bureaus could treat this as an adjacent feature if you do not move fast.",
      )
    }

    // Monetization drivers
    if (idea.revenueModel) {
      pushDriver(
        "Monetization",
        "up",
        "Clear monetization paths exist via lenders (underwriting), SMEs (analytics), or anchors (procurement tooling).",
      )
    } else {
      pushDriver("Monetization", "down", "No clear view yet on who pays: lenders, vendors, or anchors.")
    }

    // Execution drivers
    pushDriver(
      "Execution",
      "down",
      "Complex integrations with ERPs, GSTN, and banking/payment rails; plus heavy compliance and data-consent work.",
    )
    if (executionScore >= 6) {
      pushDriver(
        "Execution",
        "up",
        "If you can wedge into one vertical with one anchor, execution risk becomes more about repeatability than possibility.",
      )
    }

    // Founder-fit drivers
    if (idea.targetMarket && containsAny(idea.targetMarket, ["msme", "sme", "vendor", "enterprise"])) {
      pushDriver(
        "Founder Fit",
        "up",
        "Target market definition mentions MSMEs/SMEs and enterprise buyers explicitly; you are thinking at the right layer.",
      )
    }
    if (founderFitScore < 8) {
      pushDriver(
        "Founder Fit",
        "down",
        "Founder narrative around why you personally can unlock data access and distribution in India B2B is not yet visible.",
      )
    }
  } else {
    // Generic drivers for non-special domains.
    if (tamSamSom.TAM) {
      pushDriver("Market", "up", "Clear market bucket with a reasonable TAM heuristic.")
    } else {
      pushDriver("Market", "down", "Market size is unclear; TAM estimated from a very generic bucket.")
    }

    if (matched.length >= 2) {
      pushDriver("Competition", "up", "Multiple KG comparables suggest the space is legible and investors understand it.")
    } else {
      pushDriver("Competition", "down", "Few or no historical comparables; you will have to educate the market from scratch.")
    }

    if (!idea.revenueModel) {
      pushDriver("Monetization", "down", "Revenue model is missing; monetization risk is high.")
    } else {
      pushDriver("Monetization", "up", "Explicit revenue model provided.")
    }

    if (descLen > 80 && idea.keyFeatures && idea.keyFeatures.length >= 3) {
      pushDriver("Execution", "up", "Execution story is at least somewhat thought through in the description and feature list.")
    } else {
      pushDriver("Execution", "down", "Execution details are thin; it is unclear how this would be built and shipped.")
    }

    if (!idea.targetMarket || idea.targetMarket.length < 40) {
      pushDriver("Founder Fit", "down", "Target market / ICP is not sharply defined.")
    } else {
      pushDriver("Founder Fit", "up", "Target market is described in enough detail to start meaningful outreach.")
    }
  }

  // Ensure at least one downside driver per dimension when score < 8.
  const ensureDownside = (dimension: string, scoreValue: number, fallback: string) => {
    if (scoreValue < 8 && !driversDown.some((d) => d.startsWith(`${dimension}:`))) {
      pushDriver(dimension, "down", fallback)
    }
  }

  ensureDownside("Market", marketScore, "Investors will worry that the target market is either too small or too vague.")
  ensureDownside("Competition", competitionScore, "You have not yet shown why this wins against the status quo.")
  ensureDownside("Monetization", monetizationScore, "Who pays, how much, and why now is still fuzzy.")
  ensureDownside("Execution", executionScore, "Execution path (build, launch, iterate) is not spelled out enough.")
  ensureDownside("Founder Fit", founderFitScore, "Story for why you are uniquely suited to this market is not obvious.")

  // Domain-aware fix impact experiments.
  let fixImpacts: { label: string; delta: number }[]
  if (domain.key === "india-b2b-fintech") {
    fixImpacts = [
      {
        label:
          "Pick one wedge vertical (e.g., logistics MSMEs) and sign 5 anchor buyers willing to share invoice/payment data under NDA.",
        delta: 2.0,
      },
      {
        label:
          "Prototype a simple Payment Behaviour Score using 1–2 data sources (GST/invoices) and run it by 5 lenders or fintechs as a credit signal.",
        delta: 1.7,
      },
      {
        label:
          "Run a tiny marketplace-style experiment with 20–50 vendors to test whether visibility of PBS would change who they work with or on what terms.",
        delta: 1.3,
      },
    ]
  } else {
    fixImpacts = [
      { label: "Sharpen ICP and target market description", delta: 2.0 },
      { label: "Specify concrete pricing / revenue model", delta: 1.5 },
      { label: "Expand problem description with real customer quotes", delta: 1.0 },
    ]
  }

  // Strengthened comparable logic: require industry + reasonable semantic overlap. If no strong matches, we may still fall back to
  // domain-based analogues.
  const ideaTokens = new Set(extractIdeaTokens(idea))
  const strongComparables = matched.filter((item) => {
    const scoreVal = scoreItem(ideaTokens, item)
    const tagsLower = (item.tags || []).map((t) => t.toLowerCase())
    const industry = idea.industry?.toLowerCase() || ""
    const industryMatch = industry && tagsLower.includes(industry)
    const revenueModel = idea.revenueModel?.toLowerCase() || ""
    const revMatch = revenueModel ? tagsLower.includes(revenueModel) : true
    const strongScore = scoreVal >= 0.25 // empirical heuristic
    return industryMatch && revMatch && strongScore
  })

  let comparables = strongComparables.map((item) => ({
    name: item.name,
    reason: `Strong KG match in ${idea.industry || "similar"} with tags: ${item.tags.slice(0, 3).join(", ")}`,
    url: item.url,
  }))

  if (comparables.length === 0 && domain.key === "india-b2b-fintech") {
    comparables = [
      {
        name: "CIBIL / Experian for businesses",
        reason: "Analogue: business credit bureaus that score repayment behaviour; you are proposing a similar reputational layer for trade payables in India.",
      },
      {
        name: "Dun & Bradstreet-style business information",
        reason: "Analogue: B2B information providers whose scores influence who gets credit and on what terms.",
      },
      {
        name: "Taulia / C2FO / Tradeshift",
        reason: "Analogue: platforms that use invoice and payment data to change how and when suppliers get paid.",
      },
    ]
  }

  const summary = buildSummary(idea, classification, score, domain)
  const longReport = buildLongReport(idea, classification, score, domain, topRisks, pivots, tamSamSom, comparables)

  const response: FreeValidationResponse = {
    classification,
    score,
    summary,
    longReport,
    topRisks,
    pivots,
    comparables,
    tamSamSom,
    scoreBreakdown: {
      market: marketScore,
      competition: competitionScore,
      monetization: monetizationScore,
      execution: executionScore,
      founderFit: founderFitScore,
      weights,
      driversUp,
      driversDown,
      fixImpacts,
    },
    metadata: {
      sourceKeysUsed: ["local-kg-v1"],
      cached: false,
      generatedAt: new Date().toISOString(),
    },
  }

  return response
}
