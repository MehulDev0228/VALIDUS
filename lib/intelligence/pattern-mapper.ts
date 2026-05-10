import type { IdeaInput } from "@/lib/schemas/idea"
import type { StartupArchetype } from "@/lib/agents/category-lens"
import { inferArchetype } from "@/lib/agents/category-lens"
import type { IndustryClassification, IndustryVertical } from "@/lib/intelligence/industry-types"
import { isExplicitTwoSidedMarketplaceText } from "@/lib/intelligence/industry-classification"
import { deriveBehavioralMechanics } from "@/lib/intelligence/behavioral-mechanics"
import { buildPatternExecutionFallback, deriveDistributionMechanics } from "@/lib/intelligence/distribution-mechanics"
import { deriveFounderNarrativeHooks, deriveFounderVerdictPressure } from "@/lib/intelligence/founder-mechanics"
import { deriveMarketMechanics } from "@/lib/intelligence/market-mechanics"
import type {
  BehavioralDependency,
  DistributionModel,
  HistoricalMechanismProfile,
  MarketType,
  NetworkEffectType,
  RiskTier,
  StartupPattern,
  SwitchTier,
} from "@/lib/intelligence/startup-patterns"
import { HISTORICAL_MECHANISM_LIBRARY } from "@/lib/intelligence/startup-patterns"

export type PatternGraphBundle = {
  pattern: StartupPattern
  effectiveArchetype: StartupArchetype
  historicalMatches: HistoricalMechanismProfile[]
  mechanismBrief: string
  executionBrief: string
  verdictPressureBrief: string
  executionFallback48h: ReturnType<typeof buildPatternExecutionFallback>
}

function corpus(idea: IdeaInput): string {
  const feat = (idea.keyFeatures || []).join(" ")
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""} ${idea.revenueModel || ""} ${feat}`.toLowerCase()
}

const WORKFLOW_TERMS = [
  "notion",
  "wiki",
  "workspace",
  "docs",
  "documentation",
  "knowledge base",
  "intranet",
  "playbook",
  "prd",
  "project management",
  "calendar scheduling",
  "scheduling link",
  "zoom",
  "video conferencing",
  "web conferencing",
  "meetings",
  "slack",
  "teams",
  "figma",
  "canvas",
  "spreadsheet",
  "workflow automation",
]

const VIDEO_MEET_TERMS = ["zoom", "video conferencing", "web conferencing", "webinar"]

function countHits(t: string, keys: string[]): number {
  return keys.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0)
}

function scoreMarketTypes(t: string, industry?: IndustryClassification): Record<MarketType, number> {
  /** Avoid classifying factory/industrial "supply chain" language as a consumer marketplace */
  const marketplaceHits = countHits(t, [
    "marketplace",
    "two-sided",
    "two sided",
    "buyers and sellers",
    "take rate",
    "gig economy",
    "liquidity",
    "disintermediation",
    "hosts and guests",
  ])
  const indVertical = industry?.primaryVertical
  const industrialAnchor =
    countHits(t, ["factory", "manufacturing", "plc", "robot", "assembly line", "oee", "scada", "mes"]) +
    countHits(t, ["warehouse", "fulfillment", "3pl", "forklift", "dock"])
  let marketplace = marketplaceHits
  if (industrialAnchor >= 3 && indVertical && indVertical !== "marketplaces") {
    marketplace -= Math.min(9, industrialAnchor + (marketplaceHits >= 2 ? 3 : 0))
  }
  const score: Record<MarketType, number> = {
    marketplace,
    developer_tool: countHits(t, [
      "api",
      "sdk",
      "developer",
      "devops",
      "git",
      "observability",
      "infra",
      "payments api",
      "stripe-like",
      "integrations for engineers",
      "dropbox",
      "folder sync",
    ]),
    infra: countHits(t, ["cloud provider", "kubernetes", "data center", "edge network", "cdn"]),
    workflow: WORKFLOW_TERMS.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0),
    consumer_social: countHits(t, ["social feed", "friends graph", "viral invites", "mobile social", "short video"]),
    b2b_saas: countHits(t, ["b2b", "saas", "enterprise", "crm", "erp", "compliance suite", "security review"]),
    fintech: countHits(t, ["fintech", "ledger", "lending", "wallet", "compliance aml", "kyc", "card issuing"]),
    creator_tool: countHits(t, ["creator tool", "for creators", "content editor", "meme maker", "video editor"]),
    ecommerce: countHits(t, ["ecommerce", "dtc", "sku", "shopify", "retail"]),
    ai_wrapper: countHits(t, ["openai", "gpt", "llm", "generative ai", "prompt chaining", "ai wrapper"]),
  }

  /** Penalize misclassification pathways */
  if (countHits(t, WORKFLOW_TERMS) >= 2) {
    score.consumer_social -= 4
    score.workflow += 3
  }
  if (VIDEO_MEET_TERMS.some((k) => t.includes(k))) {
    score.workflow += 5
    score.b2b_saas += 1
    score.consumer_social -= 2
  }
  return score
}

function topMarket(scores: Record<MarketType, number>): MarketType {
  let best: MarketType = "b2b_saas"
  let max = -999
  ;(Object.keys(scores) as MarketType[]).forEach((k) => {
    if (scores[k] > max) {
      max = scores[k]
      best = k
    }
  })
  return best
}

export function marketTypeToArchetype(mt: MarketType): StartupArchetype {
  switch (mt) {
    case "marketplace":
      return "marketplace"
    case "developer_tool":
    case "infra":
      return "developer_tool"
    case "consumer_social":
      return "consumer_social"
    case "b2b_saas":
    case "workflow":
      return "b2b_saas"
    case "fintech":
      return "fintech"
    case "creator_tool":
      return "b2b_saas"
    case "ecommerce":
      return "ecommerce_dtc"
    case "ai_wrapper":
      return "ai_layer"
    default:
      return "generic"
  }
}

function matchHistoricalAnchors(t: string): HistoricalMechanismProfile[] {
  const hits: HistoricalMechanismProfile[] = []
  for (const profile of HISTORICAL_MECHANISM_LIBRARY) {
    if (profile.aliases.some((a) => t.includes(a))) hits.push(profile)
  }
  // Prefer longer aliases (more specific tokens like "video conferencing")
  hits.sort((a, b) => Math.max(...b.aliases.map((x) => x.length)) - Math.max(...a.aliases.map((x) => x.length)))
  return hits
}

function patternFromHistorical(profile: HistoricalMechanismProfile): StartupPattern {
  return {
    id: `historical-anchor:${profile.id}`,
    marketType: profile.marketType,
    distributionModel: profile.distributionModel,
    networkEffectType: profile.networkEffectType,
    switchingCost: profile.switchingCost,
    behavioralDependency: profile.behavioralDependency,
    timingSensitivity: profile.timingSensitivity,
    platformRisk: profile.platformRisk,
    operationalComplexity: profile.operationalComplexity,
    monetizationRisk: profile.monetizationRisk,
    patternTags: profile.patternTags,
  }
}

function inferDistributionModel(t: string, mt: MarketType): DistributionModel {
  if (mt === "marketplace") return "supply_side_first"
  if (/\benterprise sales\b|\bfiel(d)? sales\b|\bquota\b|\bprocurement\b/i.test(t)) return "sales_led"
  if (/\bseo\b|\borganic search\b|\bcontent flywheel\b/i.test(t)) return "seo"
  if (/\bpaid ads\b|\bfacebook ads\b|\bgoogle ads\b|\bcac\b|\bua\b|\bpaid ua\b/i.test(t)) return "paid_acquisition"
  if (/\binvite\b|\bviral\b|\bloop\b|\breferral\b/i.test(t)) return "viral"
  if (/\breddit\b|\bdiscord\b|\bcommunity\b|\bforum\b|\bslack community\b/i.test(t)) return "community"
  if (/\bcreator\b|\binfluencer\b/i.test(t)) return "creator_led"
  if (mt === "developer_tool" || mt === "infra" || mt === "workflow" || mt === "creator_tool") return "bottom_up"
  return "bottom_up"
}

function inferBehavior(t: string): BehavioralDependency {
  if (/\btrust\b|\bescrow\b|\bfraud\b|\bsafety\b|\bverified\b|\breputation\b|\breview\b|\bmarketplace\b/i.test(t)) return "trust"
  if (/\bstatus\b|\bprestige\b|\bexclusive\b|\binvite-only\b|\bclub\b/i.test(t)) return "status"
  if (/\bhabit\b|\bdaily\b|\bretention\b|\bloop\b|\bfeed\b/i.test(t)) return "habit"
  if (/\bfear\b|\bcompliance\b|\bpanic\b|\bvp\b|\bsecurity\b|\bdownside\b/i.test(t)) return "fear"
  if (/\bcommunity\b|\bpeers\b|\bvalidation\b/i.test(t)) return "social_validation"
  if (/\bdesign\b|\bnarrative\b|\btaste\b|\bbrand\b|\bcraft\b|\bportfolio\b/i.test(t)) return "identity"
  return "utility"
}

function inferSwitching(t: string, mt: MarketType): SwitchTier {
  if (/\bhigh switching\b|\blocked in\b|\bworkflow lock\b|\bsso\b|\bintegration mesh\b|\bcomment graph\b/i.test(t))
    return "high"
  if (mt === "workflow" || mt === "developer_tool") return "medium"
  return "low"
}

function inferNetwork(t: string, mt: MarketType): NetworkEffectType {
  if (mt === "marketplace") return "cross_side"
  if (/\bmultiplayer\b|\brealtime\b|\bcollaborat\b|\bshared canvas\b|\bdoc sync\b|\bpresence\b/i.test(t)) return "direct"
  if (
    /\bpayments\b|\billing\b|\bwallet\b|\btransaction graph\b|\bdata network\b|\bmodel improves\b|\bfeedback loop\b/i.test(t)
  )
    return "data"
  if (/\bintegrations\b|\bplugin\b|\bmarketplace integrations\b|\bworkflow\b|\bapi mesh\b|\bwebhook\b/i.test(t))
    return "workflow_lockin"
  return "none"
}

function inferRiskSignals(t: string, kind: "timing" | "platform" | "ops" | "mon"): RiskTier {
  const hype = /\bhype\b|\bfomo\b|\bwave\b|\bwindow\b|\bregulation\b|\bban\b|\bshutdown\b|\bquota\b|\bapi access\b|\balgo\b|\bfeed\b|\bplatform risk\b/i.test(t)
  const plat = /\bfacebook\b|\bmeta\b|\bgoogle\b|\bapple\b|\bapp store\b|\bcloudflare\b|\bopenai\b|\bmodel provider\b/i.test(t)
  const ops = /\bhardware\b|\blogistics\b|\bfulfillment\b|\bcapex\b|\bops-heavy\b|\b247\b|\bsupport-heavy\b|\bregulated\b|\blicense\b/i.test(t)
  const mon = /\bads\b|\bcpm\b|\bsubscription fatigue\b|\bprice war\b|\bcommodit\b|\bcheap substitutes\b|\bfree tiers\b|\bmargin squeeze\b/i.test(t)
  const hit =
    kind === "timing"
      ? hype
      : kind === "platform"
        ? hype || plat
        : kind === "ops"
          ? ops
          : mon
  return hit ? "high" : "medium"
}

function synthesizePattern(idea: IdeaInput, mt: MarketType): StartupPattern {
  const t = corpus(idea)
  return {
    id: `synthetic:${idea.title.replace(/\s+/g, "-").slice(0, 48)}`,
    marketType: mt,
    distributionModel: inferDistributionModel(t, mt),
    networkEffectType: inferNetwork(t, mt),
    switchingCost: inferSwitching(t, mt),
    behavioralDependency: inferBehavior(t),
    timingSensitivity: inferRiskSignals(t, "timing"),
    platformRisk: inferRiskSignals(t, "platform"),
    operationalComplexity: inferRiskSignals(t, "ops"),
    monetizationRisk: inferRiskSignals(t, "mon"),
    patternTags: [],
  }
}

function mergePatterns(base: StartupPattern, overlay: StartupPattern): StartupPattern {
  return {
    ...base,
    ...overlay,
    patternTags: Array.from(new Set([...(base.patternTags || []), ...(overlay.patternTags || [])])),
  }
}

function clip(text: string, max = 5200): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function buildMechanismBrief(
  pattern: StartupPattern,
  historical: HistoricalMechanismProfile[],
): string {
  const lines: string[] = []
  lines.push("STARTUP_PATTERN_GRAPH (explicit primitives)")
  lines.push(
    JSON.stringify({
      marketType: pattern.marketType,
      distributionModel: pattern.distributionModel,
      networkEffectType: pattern.networkEffectType,
      switchingCost: pattern.switchingCost,
      behavioralDependency: pattern.behavioralDependency,
      timingSensitivity: pattern.timingSensitivity,
      platformRisk: pattern.platformRisk,
      operationalComplexity: pattern.operationalComplexity,
      monetizationRisk: pattern.monetizationRisk,
      patternTags: pattern.patternTags ?? [],
    }),
  )
  lines.push("Mechanism scaffolding:")
  deriveMarketMechanics(pattern).forEach((l) => lines.push(`- ${l}`))
  deriveBehavioralMechanics(pattern).forEach((l) => lines.push(`- ${l}`))
  deriveDistributionMechanics(pattern).forEach((l) => lines.push(`- ${l}`))
  deriveFounderNarrativeHooks(pattern).forEach((l) => lines.push(`- ${l}`))

  if (historical[0]) {
    const h = historical[0]
    lines.push(`ANCHOR_ANALOG:${h.id}`)
    lines.push(`- WorkedMechanism:${h.whyWorkedOneLiner}`)
    lines.push(`- NearDeath:${h.nearDeathOneLiner}`)
    lines.push(`- Distribution:${h.distributionAdvantageOneLiner}`)
    lines.push(`- Behavior:${h.behavioralInsightOneLiner}`)
    lines.push(`- Timing:${h.timingOneLiner}`)
    lines.push(`- OpsBottleneck:${h.operationalBottleneckOneLiner}`)
    lines.push(`- Monetization:${h.monetizationModelOneLiner}`)
    lines.push(`- Moat:${h.moatOneLiner}`)
    lines.push("Use anchors as methodological inspiration, NOT as prediction that this founder copies history.")
  }

  lines.push(
    'Surface at least TWO sentences in your output that cite a mechanism comparable in specificity to "This only works if supply quality variance makes hotels feel emotionally untrustworthy" when applicable.',
  )

  return clip(lines.join("\n"))
}

function industryPreferredArchetype(v: IndustryVertical): StartupArchetype {
  const map: Record<IndustryVertical, StartupArchetype> = {
    manufacturing_robotics: "vertical_saas",
    industrial_infra: "vertical_saas",
    logistics: "vertical_saas",
    healthcare: "vertical_saas",
    biotech: "vertical_saas",
    fintech: "fintech",
    developer_tools: "developer_tool",
    ai_infrastructure: "developer_tool",
    saas: "b2b_saas",
    marketplaces: "marketplace",
    consumer_social: "consumer_social",
    enterprise_workflow: "b2b_saas",
    education: "vertical_saas",
    creator_economy: "b2b_saas",
    ecommerce: "ecommerce_dtc",
    smb_software: "b2b_saas",
    climate_energy: "vertical_saas",
    deeptech: "hardware_subscription",
    cybersecurity: "b2b_saas",
  }
  return map[v] ?? "b2b_saas"
}

function resolveEffectiveArchetype(
  idea: IdeaInput,
  t: string,
  mt: HistoricalMechanismProfile | null,
  scoredType: MarketType,
  industry?: IndustryClassification,
): StartupArchetype {
  const lexical = inferArchetype(idea)
  let resolved: StartupArchetype

  if (mt) {
    resolved = marketTypeToArchetype(mt.marketType)
  } else {
    const patterned = marketTypeToArchetype(scoredType)
    const wfHits = countHits(t, WORKFLOW_TERMS)

    /** Strong workflow evidence should override brittle consumer_social classification (Notion/Zoom/etc.) */
    if (wfHits >= 3 && lexical === "consumer_social") {
      resolved = "b2b_saas"
    } else {
      const scores = scoreMarketTypes(t, industry)
      /** If keyword model confident and conflicts with lexical generic/mismatch, prefer pattern */
      if (scores[scoredType] >= 5 && lexical === "generic") resolved = patterned
      else if (scores[scoredType] >= 6 && patterned !== lexical) resolved = patterned
      else resolved = lexical
    }
  }

  if (
    industry &&
    industry.primaryVertical !== "marketplaces" &&
    resolved === "marketplace" &&
    !isExplicitTwoSidedMarketplaceText(t)
  ) {
    resolved = industryPreferredArchetype(industry.primaryVertical)
  }

  return resolved
}

export function buildPatternGraph(idea: IdeaInput, industry?: IndustryClassification): PatternGraphBundle {
  const t = corpus(idea)
  const historicalMatches = matchHistoricalAnchors(t)
  const scoredType = topMarket(scoreMarketTypes(t, industry))

  let pattern: StartupPattern = synthesizePattern(idea, scoredType)
  const primaryHistorical = historicalMatches[0]

  if (primaryHistorical) {
    pattern = mergePatterns(pattern, patternFromHistorical(primaryHistorical))
    pattern.marketType = primaryHistorical.marketType
  }

  const effectiveArchetype = resolveEffectiveArchetype(idea, t, primaryHistorical ?? null, scoredType, industry)

  const mechanismBrief = buildMechanismBrief(pattern, historicalMatches)
  const execLines = deriveDistributionMechanics(pattern)
  const executionBrief = clip(
    `${execLines.join("\n")}\n\nFORBIDDEN_GENERIC_ONLY_PLAN: Treat "post on Reddit + LinkedIn DMs + generic landing page" as failure unless IdeaContext proves that spine matches the enumerated distribution primitives.`,
    2400,
  )
  const verdictPressureBrief = clip(deriveFounderVerdictPressure(pattern), 2600)

  return {
    pattern,
    effectiveArchetype,
    historicalMatches,
    mechanismBrief,
    executionBrief,
    verdictPressureBrief,
    executionFallback48h: buildPatternExecutionFallback(pattern),
  }
}
