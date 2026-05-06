import type { MarketType, StartupPattern } from "@/lib/intelligence/startup-patterns"
import { deriveFounderVerdictPressure } from "@/lib/intelligence/founder-mechanics"

export type FounderMode =
  | "ContrarianBuilder"
  | "DistributionMaximalist"
  | "OperationalRealist"
  | "PlatformParanoid"
  | "ProductPurist"
  | "MarketTimingHunter"
  | "CommunityCultivator"
  | "InfraOperator"
  | "GrowthSkeptic"
  | "MarginDisciplinarian"
  | "WorkflowDisruptor"

const MODE_VOICE: Record<FounderMode, string> = {
  ContrarianBuilder:
    "Tolerate looking wrong in public — chase asymmetric payoff when consensus cries 'niche'. Skepticism often tracks herd lag, not ground truth.",
  DistributionMaximalist:
    "Assume distribution is destiny — most 'product debates' hide broken acquisition. Nail a spine (PLG, supply, partner, paid) or nothing else matters.",
  OperationalRealist:
    "Trust execution viscosity over vision — payouts, SLAs, onboarding queues, moderation, refunds, and edge-case failure decide survival.",
  PlatformParanoid:
    "Treat rented channels as hostile — APIs, feeds, OS bundling, storefront rules. Assume incumbents clone your surface area next quarter.",
  ProductPurist:
    "Obsess relief, latency, clarity, and multiplayer craft — delight and removal of shameful friction create pull that funnels cannot fake for long.",
  MarketTimingHunter:
    "Stress calendar windows — regulatory, infra, or behavior shifts open spend that structurally did not exist eighteen months prior.",
  CommunityCultivator:
    "Subculture density beats generic reach — rituals, insider slang, and embarrassment costs beat billboards for fragile social tools.",
  InfraOperator:
    "Think uptime, migration tax, webhooks, ledger correctness, and fraud tails — reliability and integration depth beat slide poetry.",
  GrowthSkeptic:
    "Vanity metrics invite self-deception — interrogate cohort purity, payer concentration, resurrection, and subsidy masks.",
  MarginDisciplinarian:
    "Unit economics are narrative police — CAC step-changes, rake compression, breakage, and COGS swings kill stories faster than competition.",
  WorkflowDisruptor:
    "Collaboration primitives win on simultaneous truth + comment graphs — not feature parity laundry lists spun by suites.",
}

const HISTORICAL_MODE_PRESETS: Record<string, FounderMode[]> = {
  airbnb: ["ContrarianBuilder", "CommunityCultivator", "OperationalRealist"],
  uber: ["DistributionMaximalist", "OperationalRealist", "PlatformParanoid"],
  stripe: ["InfraOperator", "ProductPurist", "PlatformParanoid"],
  shopify: ["DistributionMaximalist", "MarginDisciplinarian", "PlatformParanoid"],
  figma: ["ProductPurist", "WorkflowDisruptor", "PlatformParanoid"],
  slack: ["ProductPurist", "DistributionMaximalist", "PlatformParanoid"],
  notion: ["ProductPurist", "WorkflowDisruptor", "ContrarianBuilder"],
  zoom: ["OperationalRealist", "ProductPurist", "MarketTimingHunter"],
  clubhouse: ["MarketTimingHunter", "GrowthSkeptic", "CommunityCultivator"],
  quibi: ["GrowthSkeptic", "MarginDisciplinarian", "PlatformParanoid"],
  juicero: ["OperationalRealist", "MarginDisciplinarian", "GrowthSkeptic"],
  zynga: ["PlatformParanoid", "GrowthSkeptic", "DistributionMaximalist"],
  basecamp: ["ContrarianBuilder", "ProductPurist", "MarginDisciplinarian"],
  dropbox: ["InfraOperator", "DistributionMaximalist", "PlatformParanoid"],
  calendly: ["ProductPurist", "DistributionMaximalist", "PlatformParanoid"],
}

function defaultModesForMarketType(mt: MarketType): FounderMode[] {
  switch (mt) {
    case "marketplace":
      return ["DistributionMaximalist", "CommunityCultivator", "OperationalRealist"]
    case "developer_tool":
    case "infra":
      return ["InfraOperator", "PlatformParanoid", "ProductPurist"]
    case "workflow":
    case "b2b_saas":
      return ["OperationalRealist", "ProductPurist", "PlatformParanoid"]
    case "consumer_social":
      return ["GrowthSkeptic", "CommunityCultivator", "MarketTimingHunter"]
    case "fintech":
      return ["InfraOperator", "MarginDisciplinarian", "PlatformParanoid"]
    case "ecommerce":
      return ["DistributionMaximalist", "MarginDisciplinarian", "OperationalRealist"]
    case "ai_wrapper":
      return ["GrowthSkeptic", "PlatformParanoid", "ProductPurist"]
    case "creator_tool":
      return ["ProductPurist", "WorkflowDisruptor", "DistributionMaximalist"]
    default:
      return ["OperationalRealist", "GrowthSkeptic", "DistributionMaximalist"]
  }
}

function distributionTilt(pattern: StartupPattern, modes: FounderMode[]): FounderMode[] {
  const out = [...modes]
  if (pattern.distributionModel === "viral" || pattern.distributionModel === "creator_led") {
    if (!out.includes("MarketTimingHunter")) out[2] = "MarketTimingHunter"
  }
  if (pattern.distributionModel === "sales_led") {
    if (!out.includes("OperationalRealist")) out.unshift("OperationalRealist")
  }
  if (pattern.distributionModel === "supply_side_first") {
    if (!out.includes("DistributionMaximalist")) out[0] = "DistributionMaximalist"
  }
  return Array.from(new Set(out)).slice(0, 3)
}

export function resolveFounderModes(pattern: StartupPattern, historicalAnchorId?: string | null): FounderMode[] {
  if (historicalAnchorId && HISTORICAL_MODE_PRESETS[historicalAnchorId]) {
    return distributionTilt(pattern, [...HISTORICAL_MODE_PRESETS[historicalAnchorId]])
  }
  return distributionTilt(pattern, defaultModesForMarketType(pattern.marketType))
}

export function founderModeVoiceLines(modes: FounderMode[]): string[] {
  return modes.map((m) => `- ${m}: ${MODE_VOICE[m]}`)
}

export function founderModesAgentBrief(modes: FounderMode[]): string {
  const lines = [
    `FOUNDER_COGNITIVE_MODES (${modes.join(", ")}):`,
    "Write with the posture of these archetypes fused — NOT neutral consulting narration.",
    "Each insight should sound like operators who burned cash once and remember which lie killed them.",
    ...founderModeVoiceLines(modes),
  ]
  return lines.join("\n")
}

export function founderModesJudgeBrief(modes: FounderMode[], pattern: StartupPattern): string {
  const lines = [
    "═══════════════════════════════════════════════════════",
    "FOUNDER_MODE_ENGINE — cognitive priors you MUST embody",
    "═══════════════════════════════════════════════════════",
    ...founderModeVoiceLines(modes),
    "",
    "ASYMMETRY_MANDATE: Uncertainty PLUS asymmetry is often the opportunity lens — narrate BOTH upside tails and ruin tails without collapsing them into lukewarm PIVOT autopilot.",
    "FORBIDDEN_DEFAULTS: Avoid MBA hedging (‘interesting’, ‘needs validation’, ‘consider testing’) unless paired with ruthless mechanism diagnosis.",
    "VERDICT_BRAVERY:",
    `- Strong BUILD allowed when differentiated distribution or behavioral inevitability is credible even while risks remain.`,
    `- Strong KILL allowed when wedge is disguised feature, subsidy fiction, doomed channel rent, or copy-paste hallucination.`,
    `- Conviction-heavy PIVOT when the insight survives but wedge/ICP/pay motion is objectively wrong.`,
    "",
    deriveFounderVerdictPressure(pattern),
    "",
    "METRIC_DEBIAS:",
    `- opportunityScore must occupy the full pragmatic band — clustered ~52 reads as fabricated. BUILD with persuasive asymmetry routinely lands roughly 61–93; persuasive KILL often 11–54; nuanced PIVOT commonly 34–82.`,
    `- confidence spans ~0.45–0.91 — paradoxically high-confidence KILL when structure is blatant.`,
    `- brutalSummary ought to sting emotionally when you are diagnosing denial, nostalgia, platform rent, or self-congratulatory metrics.`,
  ]
  return lines.join("\n")
}

export function founderModeExecutionGrain(modes: FounderMode[]): string {
  const hints: string[] = []
  if (modes.includes("InfraOperator")) {
    hints.push(
      "InfraOperator edge: tests must touch migration, webhook failure, ledger edge cases, or uptime stories — not generic landing copy.",
    )
  }
  if (modes.includes("DistributionMaximalist")) {
    hints.push(
      "DistributionMaximalist edge: every step names the acquisition spine + quantified leading indicator + kill threshold that insults vanity metrics.",
    )
  }
  if (modes.includes("CommunityCultivator")) {
    hints.push(
      "CommunityCultivator edge: density inside one subculture or city cell — avoid ‘post broadly’ unless you prove which ritual already exists.",
    )
  }
  if (modes.includes("PlatformParanoid")) {
    hints.push(
      "PlatformParanoid edge: include explicit API/algorithm/regulatory rug-pull test or counter-positioning move — not generic interviews.",
    )
  }
  if (modes.includes("ProductPurist") || modes.includes("WorkflowDisruptor")) {
    hints.push(
      "Product/Workflow edge: execution steps reference measurable latency relief, multiplayer ritual, or workflow replacement pain — not boilerplate screen shares.",
    )
  }
  if (hints.length === 0) {
    hints.push("Force at least one step that would make a cynical partner say ‘that actually hurts’.")
  }
  return hints.join("\n")
}
