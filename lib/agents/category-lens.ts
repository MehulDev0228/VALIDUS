import type { IdeaInput } from "@/lib/schemas/idea"

export type StartupArchetype =
  | "marketplace"
  | "b2b_saas"
  | "developer_tool"
  | "consumer_social"
  | "fintech"
  | "hardware_subscription"
  | "vertical_saas"
  | "ecommerce_dtc"
  | "ai_layer"
  | "generic"

export interface ArchetypeLens {
  archetype: StartupArchetype
  label: string
  researchMandate: string
  judgeMandate: string
  agentTension: Record<string, string>
  specificRiskPool: string[]
  pivotHints: { title: string; why: string }[]
}

const SCORE = (t: string, keys: string[]) => keys.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0)

export function inferArchetype(idea: IdeaInput): StartupArchetype {
  const t = `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""}`.toLowerCase()

  const ranked: Array<{ id: StartupArchetype; w: number }> = [
    {
      id: "marketplace",
      w: SCORE(t, [
        "marketplace",
        "two-sided",
        "two sided",
        "buyers and sellers",
        "take rate",
        "gig",
        "hosts",
        "guest",
        "riders",
        "drivers",
        "contractors",
        "matching",
        "airbnb",
        "uber",
        "lyft",
        "rideshare",
        "ridesharing",
        "lodging",
        "homestay",
        "short-term rental",
        "vacation rental",
        "peer-to-peer",
        "peer to peer",
        "sharing economy",
        "disintermediation",
        "multi-homing",
        "multi homing",
      ]),
    },
    {
      id: "developer_tool",
      w: SCORE(t, [
        "api",
        "sdk",
        "developer",
        "devops",
        "kubernetes",
        "ci/cd",
        "observability",
        "infra",
        "git",
        "engineers",
        "dropbox",
        "file sync",
        "cloud storage",
        "online backup",
        "sync folders",
      ]),
    },
    { id: "consumer_social", w: SCORE(t, ["social", "feed", "friends", "viral", "creator", "community", "consumer app"]) },
    { id: "fintech", w: SCORE(t, ["payment", "lending", "credit", "bank", "fintech", "wallet", "underwriting", "nbfc"]) },
    {
      id: "hardware_subscription",
      w: SCORE(t, ["hardware", "device", "bike", "scooter", "iot", "sensor", "connected", "subscription box"]),
    },
    {
      id: "vertical_saas",
      w: SCORE(t, ["clinic", "vet", "restaurant", "construction", "contractor", "vertical", "practice management"]),
    },
    { id: "ecommerce_dtc", w: SCORE(t, ["dtc", "ecommerce", "sku", "retail", "fashion", "brand", "shopify", "merchant"]) },
    { id: "ai_layer", w: SCORE(t, ["openai", "gpt", "llm", "wrapper", "chatgpt", "prompt", "generative ai"]) },
    { id: "b2b_saas", w: SCORE(t, ["b2b", "saas", "enterprise", "workflow", "team", "procurement", "compliance", "crm", "erp"]) },
  ]

  ranked.sort((a, b) => b.w - a.w)
  if (ranked[0].w >= 2) return ranked[0].id
  if (ranked[0].w === 1) return ranked[0].id
  return "generic"
}

export function getArchetypeLens(archetype: StartupArchetype): ArchetypeLens {
  const marketplace: ArchetypeLens = {
    archetype: "marketplace",
    label: "Two-sided marketplace",
    researchMandate:
      "Category-native analysis only: cross-side vs same-side effects, local density, trust/fraud/disintermediation, take-rate vs dual CAC, cold-start geography.",
    judgeMandate:
      "Reference liquidity, chicken-and-egg, trust, regional density, or take-rate. Forbidden: vague WTP/distribution critiques without naming which side pays.",
    agentTension: {
      MarketResearchAgent:
        "DEMAND/SUPPLY STRUCTURE specialist. Give one plausible density or segment wedge. verdictLean BUILD or PIVOT if wedge exists; KILL only if both sides structurally blocked.",
      CompetitorAgent:
        "MULTI-HOMING + incumbent one-side ownership. Aggressive skepticism. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Rake, promos, subsidies — dual-sided unit economics. verdictLean PIVOT or KILL if math cannot close.",
      FeasibilityAgent:
        "Fraud, payouts, support, local regulation. verdictLean PIVOT or KILL if ops underestimated.",
      ICPAgent:
        "Why users leave to phone/cash/off-platform. stance mixed; insights behavioral.",
      RiskFailureAgent:
        "Liquidity spiral, safety scandal, ban. verdictLean KILL or PIVOT only.",
      ValidationStrategyAgent:
        "Concrete 48h: LOIs, deposits, one-city fake door. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Dual-sided CAC outruns take rate — liquidity never reaches escape velocity.",
      "Disintermediation after first match removes repeat rake.",
      "Trust/safety failure in one region poisons the whole brand before scale.",
    ],
    pivotHints: [
      { title: "Single-sided wedge", why: "Own one side with software or supply before opening the market." },
      { title: "One micro-market depth", why: "Prove repeat transactions in one city before national story." },
    ],
  }

  const developer_tool: ArchetypeLens = {
    archetype: "developer_tool",
    label: "Developer tool / infra",
    researchMandate:
      "TTFV, CLI/CI/IDE embedding, OSS substitutes, cloud vendor roadmap risk, enterprise security path.",
    judgeMandate:
      "Ground in developer adoption and migration cost. Score must move for credible integration wedge vs commodity.",
    agentTension: {
      MarketResearchAgent:
        "Adoption velocity and narrow killer use case. verdictLean BUILD or PIVOT when path is sharp.",
      CompetitorAgent:
        "Hyperscaler + OSS duplication. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Seat vs usage; who signs PO. verdictLean PIVOT if buyer unclear.",
      FeasibilityAgent:
        "Reliability, semver, migration tax. verdictLean PIVOT or KILL if platform-wide.",
      ICPAgent:
        "Credibility in public dev channels. stance mixed.",
      RiskFailureAgent:
        "Free bundle from platform vendor. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "10 teams weekly active in real repo. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Platform ships native feature — differentiated surface vanishes.",
      "Migration cost from scripts nobody will rewrite stalls forever.",
      "Champion has no budget line — pilot dies at procurement.",
    ],
    pivotHints: [
      { title: "One integration spine", why: "Own one critical path in CI or runtime before horizontal claims." },
      { title: "Paid design partners", why: "Revenue and embed requirements before PLG scale." },
    ],
  }

  const consumer_social: ArchetypeLens = {
    archetype: "consumer_social",
    label: "Consumer social / UGC",
    researchMandate:
      "Retention D1/D7, creator supply, moderation cost, notification decay, novelty half-life — not TAM.",
    judgeMandate:
      "Name the habit loop or channel decay. Generic distribution critique is insufficient.",
    agentTension: {
      MarketResearchAgent:
        "Habit and content liquidity. verdictLean BUILD or PIVOT if loop specified.",
      CompetitorAgent:
        "Feature copy speed from incumbents. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Ads need scale; subs need habit. verdictLean PIVOT or KILL if thin.",
      FeasibilityAgent:
        "Trust/safety ops scale. verdictLean PIVOT or KILL.",
      ICPAgent:
        "Emotional job-to-be-done daily. stance mixed.",
      RiskFailureAgent:
        "Hype cliff + retention collapse. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Cohort retention by channel. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "No habit — product is a broadcast novelty with silent churn.",
      "Moderation/legal cost outpaces revenue at modest scale.",
    ],
    pivotHints: [
      { title: "Ritual micro-community", why: "Subculture density beats generic feed." },
      { title: "Creator contracts", why: "Lock supply of repeatable content units." },
    ],
  }

  const b2b_saas: ArchetypeLens = {
    archetype: "b2b_saas",
    label: "B2B SaaS",
    researchMandate:
      "ROI story, champion vs economic buyer, procurement, SOC2, expansion motion, incumbent entrenchment.",
    judgeMandate:
      "Tie reasons to sales cycle and budget line — forbid template risks without persona.",
    agentTension: {
      MarketResearchAgent:
        "Budget line and urgency. verdictLean BUILD or PIVOT when wedge clear.",
      CompetitorAgent:
        "Workflow gravity of suite incumbents. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "ACV vs CAC + services. verdictLean PIVOT or KILL if fantasy.",
      FeasibilityAgent:
        "SSO, security review, onboarding services. verdictLean PIVOT or KILL.",
      ICPAgent:
        "Who gets fired if rollout fails. stance mixed.",
      RiskFailureAgent:
        "Single-thread champion risk. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Paid pilots with SOW success criteria. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Economic buyer absent — pilot purgatory.",
      "Suite bundle blocks best-of-breed spend.",
    ],
    pivotHints: [
      { title: "One department KPI", why: "Anchor to measurable P&L line one exec owns." },
      { title: "Implementation SKU", why: "Services path to production before PLG myth." },
    ],
  }

  const fintech: ArchetypeLens = {
    archetype: "fintech",
    label: "Fintech",
    researchMandate:
      "Regulatory perimeter, fraud, partner concentration, underwriting data, float.",
    judgeMandate:
      "Name compliance/fraud surfaces. No generic startup anxiety lists.",
    agentTension: {
      MarketResearchAgent:
        "Data edge + distribution partnerships. verdictLean BUILD or PIVOT when edge named.",
      CompetitorAgent:
        "Issuers and banks copy wedges. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Spread vs default. verdictLean PIVOT or KILL.",
      FeasibilityAgent:
        "KYC/AML/PCI gates. verdictLean PIVOT or KILL.",
      ICPAgent:
        "Trust asymmetry. stance mixed.",
      RiskFailureAgent:
        "Regulatory kill or fraud tail. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Partner LOI + fraud monitoring plan. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Reclassification freezes growth mid-flight.",
      "Fraud ring drains reserves before models catch up.",
    ],
    pivotHints: [
      { title: "Narrow regulatory lane", why: "Use case regulators already greenlight." },
      { title: "Bank wears balance sheet", why: "You own UX and distribution first." },
    ],
  }

  const hardware_subscription: ArchetypeLens = {
    archetype: "hardware_subscription",
    label: "Hardware + subscription",
    researchMandate:
      "COGS, returns, freight, inventory, firmware, service network, subsidy vs LTV.",
    judgeMandate:
      "Cite capital intensity and ops — not software-only template.",
    agentTension: {
      MarketResearchAgent:
        "Habit or utility justifying box. verdictLean BUILD or PIVOT.",
      CompetitorAgent:
        "Rental/incumbent undercut. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Subscription covers breakage. verdictLean PIVOT or KILL.",
      FeasibilityAgent:
        "Supply chain variance. verdictLean PIVOT or KILL.",
      ICPAgent:
        "Install friction drives returns. stance mixed.",
      RiskFailureAgent:
        "Recall/liability. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Deposit cohort one region. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Inventory ties cash — demand dip kills runway.",
      "Returns/warranty leakage erodes subscription margin.",
    ],
    pivotHints: [
      { title: "Partner finance", why: "Move depreciation off books early." },
      { title: "Service density", why: "Repair loop before nationwide ship." },
    ],
  }

  const vertical_saas: ArchetypeLens = {
    archetype: "vertical_saas",
    label: "Vertical SaaS",
    researchMandate:
      "Vertical workflow, channel partners, compliance, system-of-record integrations.",
    judgeMandate:
      "Vertical-specific procurement and data — no generic SaaS cynicism.",
    agentTension: {
      MarketResearchAgent:
        "Depth over breadth early. verdictLean BUILD or PIVOT.",
      CompetitorAgent:
        "Legacy entrenched — switching trigger required. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Per location vs seat vs take rate. verdictLean PIVOT.",
      FeasibilityAgent:
        "Vertical integrations dominate build. verdictLean PIVOT.",
      ICPAgent:
        "Practitioner vs owner tension. stance mixed.",
      RiskFailureAgent:
        "Penetration-capped TAM. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "10 paid locations one geo. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Real TAM smaller once non-digitizable ops excluded.",
      "Channel stall after vanity pilots.",
    ],
    pivotHints: [
      { title: "One mandated integration", why: "Compliance or billing system hook." },
      { title: "Owner P&L dialect", why: "ROI in their units (tables, shifts, utilization)."},
    ],
  }

  const ecommerce_dtc: ArchetypeLens = {
    archetype: "ecommerce_dtc",
    label: "E-commerce / DTC",
    researchMandate:
      "CAC/LTV cohorts, returns, ads platform risk, inventory turns, Amazon substitution.",
    judgeMandate:
      "Cite channel economics and margin bridge.",
    agentTension: {
      MarketResearchAgent:
        "Margin after ads and returns. verdictLean BUILD or PIVOT.",
      CompetitorAgent:
        "Scale players crush me-too. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Contribution margin truth. verdictLean PIVOT or KILL.",
      FeasibilityAgent:
        "3PL and SKU complexity. verdictLean PIVOT.",
      ICPAgent:
        "Repeat purchase driver. stance mixed.",
      RiskFailureAgent:
        "CAC inflation or ad account ban. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Small batch proof sell-through. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Paid social CAC step-change removes margin.",
      "SKU sprawl explodes support and returns.",
    ],
    pivotHints: [
      { title: "Wholesale pull", why: "Retail orders before scaling performance ads." },
      { title: "Hero SKU", why: "One repeat SKU before line extension." },
    ],
  }

  const ai_layer: ArchetypeLens = {
    archetype: "ai_layer",
    label: "AI / LLM product",
    researchMandate:
      "Model commoditization, data flywheel honesty, workflow lock-in, provider risk, eval liability.",
    judgeMandate:
      "Separate demo novelty from durable workflow ownership and margin.",
    agentTension: {
      MarketResearchAgent:
        "Proprietary data or workflow moat required. verdictLean BUILD or PIVOT only with lock-in story.",
      CompetitorAgent:
        "Incumbent adds same model next quarter. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Token vs flat SaaS economics. verdictLean PIVOT or KILL.",
      FeasibilityAgent:
        "Production eval + liability. verdictLean PIVOT or KILL.",
      ICPAgent:
        "Net minutes saved vs edit burden. stance mixed.",
      RiskFailureAgent:
        "Provider price/ToS shift. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Remove premium model tier — measure retention hit. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Chat sidebar replaces product — no retained workflow.",
      "Provider roadmap subsumes entire UI.",
    ],
    pivotHints: [
      { title: "Vertical eval harness", why: "Prove accuracy on customer failure set." },
      { title: "System-of-record slice", why: "Store artifacts only your app recomputes." },
    ],
  }

  const generic: ArchetypeLens = {
    archetype: "generic",
    label: "General brief",
    researchMandate:
      "Every insight names buyer, substitute, budget signal, or channel — never abstract 'market'.",
    judgeMandate:
      "Each topReason names stakeholder, substitute, or channel mechanism.",
    agentTension: {
      MarketResearchAgent:
        "Smallest cell of urgent demand. verdictLean BUILD or PIVOT.",
      CompetitorAgent:
        "Named incumbent substitute. verdictLean KILL or PIVOT.",
      MonetizationAgent:
        "Who pays which line item. verdictLean PIVOT or KILL.",
      FeasibilityAgent:
        "What ships in 6 weeks with how many people. verdictLean PIVOT.",
      ICPAgent:
        "Pain frequency. stance mixed.",
      RiskFailureAgent:
        "Collapse sequence of assumptions. verdictLean KILL or PIVOT.",
      ValidationStrategyAgent:
        "Prepaid or LOI criterion. verdictLean BUILD or PIVOT.",
    },
    specificRiskPool: [
      "Vision without named first buyer and procurement path.",
      "No incumbent substitute named — critique stays untestable.",
    ],
    pivotHints: [
      { title: "Name wedge buyer", why: "Title + trigger event to buy this quarter." },
      { title: "Name substitute", why: "What they use today and why they would switch now." },
    ],
  }

  const map: Record<StartupArchetype, ArchetypeLens> = {
    marketplace,
    developer_tool,
    consumer_social,
    b2b_saas,
    fintech,
    hardware_subscription,
    vertical_saas,
    ecommerce_dtc,
    ai_layer,
    generic,
  }
  return map[archetype]
}

/** Regexes for template collapse — lines matching without extra specificity get replaced */
export const TEMPLATE_CLICHE_RES = [
  /distribution assumptions are weak/i,
  /differentiation.*copied quickly/i,
  /differentiation is not hard enough/i,
  /differentiation can be copied/i,
  /willingness to pay.*not validated/i,
  /willingness to pay is unproven/i,
  /wtp\b.*unproven/i,
  /paid intent\b.*unproven/i,
  /pricing power is unproven/i,
  /go-?to-?market assumptions are fragile/i,
  /market noise exists/i,
  /evidence quality is weak/i,
  /problem is plausible but/i,
  /monetization collapses under cac/i,
]

export function lineLooksLikeTemplateCliche(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 24) return false
  return TEMPLATE_CLICHE_RES.some((re) => re.test(trimmed))
}

/**
 * Replace template lines with archetype-specific risks.
 * Keeps order; uses pool cycling.
 */
export function diversifyRiskLines(lines: string[], pool: string[], seed: number): string[] {
  let k = seed % Math.max(pool.length, 1)
  return lines.map((line, i) => {
    if (!lineLooksLikeTemplateCliche(line)) return line
    const replacement = pool[(k + i) % pool.length] || line
    return replacement
  })
}

export function agentVerdictSpreadCount(
  outputs: Array<{ verdictLean?: string }>,
): number {
  const s = new Set(outputs.map((o) => o.verdictLean || "PIVOT"))
  return s.size
}
