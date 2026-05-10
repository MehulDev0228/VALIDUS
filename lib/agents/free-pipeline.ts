import { IdeaInput } from "@/lib/schemas/idea"
import { FreeValidationResponse, FreeValidationResponseSchema } from "@/lib/schemas/free-validation"
import type { KGItem } from "@/lib/kg"
import { queryKnowledgeGraph } from "@/lib/kg"
import { generateGeminiJson } from "@/lib/llm/gemini-json"
import type { ArchetypeLens, StartupArchetype } from "@/lib/agents/category-lens"
import { agentVerdictSpreadCount, diversifyRiskLines, getArchetypeLens } from "@/lib/agents/category-lens"
import { buildMechanismAwareComparables, filterPlausibleKgItems } from "@/lib/intelligence/analogue-guard"
import type { ExecutionPlannerLite } from "@/lib/intelligence/distribution-mechanics"
import {
  founderModeExecutionGrain,
  founderModesAgentBrief,
  founderModesJudgeBrief,
  resolveFounderModes,
} from "@/lib/intelligence/founder-modes"
import { buildPatternGraph } from "@/lib/intelligence/pattern-mapper"
import { decompressValidationMetrics } from "@/lib/intelligence/score-decompress"
import {
  aggregateInevitabilityWeight,
  asymmetryBriefForAgents,
  asymmetryJudgeAddendum,
  deriveInevitabilitySignals,
  diversifiedBuildSummary,
  diversifiedKillSummary,
  diversifiedPivotSummary,
  LEGEND_ANCHOR_IDS,
  nudgeVerdictForInevitability,
  overlayExecutionWedging,
  stripMechanismTemplateText,
} from "@/lib/intelligence/asymmetry-engine"
import {
  applyFounderAsymmetryVerdictCounterweight,
  aggregateFounderUpsideEnergy,
  deriveFounderAsymmetrySignals,
  founderAsymmetryBriefForAgents,
  founderAsymmetryJudgeAddendum,
  founderPainReliefForLegendNudge,
  founderUpsideBoost01,
} from "@/lib/intelligence/founder-asymmetry"
import {
  applyPainGravityVerdictGuard,
  derivePainGravitySignals,
  overlayPainAwareExecution,
  painGravityBriefForAgents,
  painGravityJudgeAddendum,
  summarizePainGate,
} from "@/lib/intelligence/pain-gravity"
import {
  applyStructuralViabilityVerdict,
  deriveStructuralViability,
  structuralViabilityAgentBrief,
  structuralViabilityJudgeAddendum,
} from "@/lib/intelligence/structural-viability"
import {
  dedupeOpeningJitter,
  diversifyExecutionLexicon,
  diversifyMemoLanguage,
} from "@/lib/intelligence/language-diversity"
import { classifyIndustryFromIdea } from "@/lib/intelligence/industry-classification"
import { formatDomainPackForPrompt } from "@/lib/intelligence/domain-packs"
import { asymmetryInstructionForIndustry, domainLanguageContract } from "@/lib/intelligence/domain-vocabulary"
import { filterInevitabilitySignalsForIndustry } from "@/lib/intelligence/domain-signal-filter"
import { attachCognitionAudit, sanitizeFreeValidationLanguage } from "@/lib/intelligence/wrongness-detection"
import {
  extractBusinessDNA,
  extractBusinessDNAHeuristic,
  formatBusinessDNAForPrompt,
} from "@/lib/intelligence/business-dna"

type AgentLean = "BUILD" | "PIVOT" | "KILL"
type IdeaContextLite = ReturnType<typeof heuristicContext>
type ResearchInsightLite = {
  title?: string
  country?: string
  trendObservation?: string
  whyItMatters?: string
  strategicImplication?: string
  opportunityAngle?: string
  finding?: string
  implication?: string
  confidence?: number
  sourceType?: "nexus" | "gemini-simulated" | "kg"
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Reduce judge MBA-default PIVOT when the specialist panel overwhelmingly agrees BUILD or KILL */
function tallyPanelLean(outputs: Array<{ verdictLean?: AgentLean }>): {
  BUILD: number
  PIVOT: number
  KILL: number
} {
  const tally = { BUILD: 0, PIVOT: 0, KILL: 0 }
  for (const o of outputs) {
    const v = (o.verdictLean || "PIVOT") as AgentLean
    tally[v] += 1
  }
  return tally
}

function rebalanceVerdictFromPanel(
  decision: AgentLean,
  outputs: Array<{ verdictLean?: AgentLean }>,
): AgentLean {
  if (decision !== "PIVOT") return decision
  const tally = { BUILD: 0, PIVOT: 0, KILL: 0 }
  for (const o of outputs) {
    const v = (o.verdictLean || "PIVOT") as AgentLean
    tally[v] += 1
  }
  if (tally.BUILD >= 3 && tally.KILL <= 1) return "BUILD"
  if (tally.KILL >= 3 && tally.BUILD <= 1) return "KILL"
  return decision
}

function classifyFromDecision(decision: AgentLean): FreeValidationResponse["classification"] {
  if (decision === "BUILD") return "high"
  if (decision === "PIVOT") return "possible"
  return "low"
}

function enforceHardLanguage(lines: string[]): string[] {
  const banned = /\b(maybe|might|could|possibly|perhaps|shows promise|has potential)\b/gi
  return lines.map((line) => line.replace(banned, "").replace(/\s{2,}/g, " ").trim())
}

function sharpenLine(input: string): string {
  return enforceHardLanguage([String(input || "")])[0]
    .replace(/\bvery\b/gi, "")
    .replace(/\bextremely\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function isGenericInsight(text: string): boolean {
  const t = `${text}`
  return (
    /\b(growing market|huge opportunity|increasing demand|large tam|massive market|early stage trend)\b/i.test(t) ||
    /\b(market noise|evidence quality is weak|without direct customer signals)\b/i.test(t)
  )
}

function scrubFrameworkResearchTitle(title: string, trend: string, idx: number): string {
  const t = sharpenLine(title)
  if (
    /mechanism check|comparable patterns|^category\s*:|nexus pulse|market pulse\b|^signal pending$/i.test(t)
  ) {
    const base = sharpenLine(trend || "").slice(0, 72)
    return sharpenLine(base ? `Partner read: ${base}` : `Partner skew #${idx + 1}`)
  }
  return t
}

function normalizeResearchInsight(
  input: ResearchInsightLite,
  country: string,
  idx = 0,
): ResearchInsightLite {
  const trend = sharpenLine(input.trendObservation || input.finding || "")
  const matters = sharpenLine(input.whyItMatters || input.implication || "")
  const implication = sharpenLine(input.strategicImplication || input.implication || "")
  const angle = sharpenLine(input.opportunityAngle || "")
  const generic = isGenericInsight(`${trend} ${matters} ${implication} ${angle}`)

  return {
    title: scrubFrameworkResearchTitle(sharpenLine(input.title || trend || "Signal"), trend, idx),
    country: sharpenLine(input.country || country),
    trendObservation: generic
      ? `${sharpenLine(trend) || "Name a segment"} — cite buyer, substitute, budget line, channel, or regional density signal; ban abstract market noise.`
      : trend,
    whyItMatters: matters || "This changes where budget authority sits and how fast pilots can close.",
    strategicImplication:
      implication || "Narrow ICP and distribution around buyers with urgent pain and direct budget control.",
    opportunityAngle:
      angle || "Win one painful wedge with paid pilots before broadening product scope.",
    finding: sharpenLine(input.finding || trend || "Signal pending"),
    implication: sharpenLine(input.implication || implication || matters || "Implication pending"),
    confidence: clampConfidence(Number(input.confidence ?? 0.62)),
    sourceType: input.sourceType || "gemini-simulated",
  }
}

function normalizeAgentPayload(role: string, raw: unknown) {
  const data = (raw || {}) as Record<string, unknown>
  const insightsRaw = Array.isArray(data.insights) ? data.insights : []
  const evidenceRaw = Array.isArray(data.evidence) ? data.evidence : []

  const roleVoicePrefix: Record<string, string> = {
    MarketResearchAgent: "Market structure:",
    CompetitorAgent: "Competitive pressure:",
    MonetizationAgent: "Revenue reality:",
    FeasibilityAgent: "Execution risk:",
    ICPAgent: "Buyer behavior:",
    RiskFailureAgent: "Failure chain:",
    ValidationStrategyAgent: "48h test:",
  }

  const prefix = roleVoicePrefix[role] || "Assessment:"
  const insights = insightsRaw
    .map((x) => sharpenLine(String(x)))
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => (line.includes(":") ? line : `${prefix} ${line}`))
  const evidence = evidenceRaw.map((x) => sharpenLine(String(x))).filter(Boolean).slice(0, 4)

  const stanceRaw = String(data.stance || "").toLowerCase()
  const stance: "supportive" | "critical" | "mixed" =
    stanceRaw === "supportive" || stanceRaw === "critical" || stanceRaw === "mixed"
      ? stanceRaw
      : role === "RiskFailureAgent"
        ? "critical"
        : "mixed"

  return {
    agent: role,
    stance,
    confidence: clampConfidence(Number(data.confidence ?? 0.6)),
    evidence,
    insights,
    verdictLean: ((data.verdictLean as AgentLean) || "PIVOT") as AgentLean,
  }
}

function heuristicContext(idea: IdeaInput) {
  const keywords = [idea.industry, idea.revenueModel, ...(idea.keyFeatures || []), idea.targetMarket]
    .filter(Boolean)
    .map((x) => String(x).trim())
    .slice(0, 12)

  return {
    problem: idea.description.slice(0, 220),
    targetUser: idea.targetMarket || "Unclear target user",
    market: idea.industry || "General market",
    coreIdea: idea.title,
    keywords,
    searchQueries: [
      `market size ${idea.industry || "startup category"} ${idea.targetMarket || ""}`.trim(),
      `startup failure reasons ${idea.industry || "this domain"}`.trim(),
      `competitors for ${idea.title}`.trim(),
    ],
    missingAssumptions: [
      "Why this customer buys now",
      "Acquisition channel economics",
      "Retention trigger after first use",
    ],
    validationGaps: [
      "Proof that users switch from current behavior",
      "Evidence that unit economics can work",
      "Short-cycle demand test with real users",
    ],
  }
}

function defaultExecutionPlanner48h(): NonNullable<FreeValidationResponse["executionPlanner48h"]> {
  return [
    {
      order: 1,
      day: "Day 1 (0-24h)",
      action:
        "Post one specificity test in two channels: Reddit (subreddit thread) OR niche Slack/Discord, plus 10 LinkedIn DMs to titled ICP.",
      platforms: ["Reddit", "LinkedIn"],
      expectedSignals: "Comments or replies naming the pain in their words; DM accept + reply rate above noise.",
      successIf:
        "If you get ≥3 substantive replies OR ≥2 booked calls → continue tightening the wedge and double volume Day 2.",
      failIf: "If silence or vague cheerleading after 24h → rewrite ICP + hook; same test once more before pivot.",
    },
    {
      order: 2,
      day: "Day 1-2",
      action: "Standalone landing page: headline, proof gap, pricing anchor, Stripe/pilot deposit CTA. Share link in Reddit + LinkedIn + X.",
      platforms: ["Reddit", "LinkedIn", "X"],
      expectedSignals: "Click-through from ICP-ish visitors; replies asking about scope and price.",
      successIf: "If ≥20 qualified visits OR ≥5 waits on calendar OR pilot deposit intent → continue building sell motion.",
      failIf: "If traffic dies or zero intent signals → kill page angle; try wedge #2 stated in IdeaContext.validationGaps.",
    },
    {
      order: 3,
      day: "Day 2 (24-48h)",
      action: "Cold email or DM script v2 referencing one measurable outcome + ask for prepaid pilot.",
      platforms: ["Email", "LinkedIn"],
      expectedSignals: "Objections tied to buying (security, SLA, onboarding) versus polite brush-off.",
      successIf:
        "If someone pays pilot / signs SOW / gives LOI → continue building delivery; defer product breadth.",
      failIf:
        "If nobody pays after ~25 quality touches → pivot positioning or kill; do not bury in build work.",
    },
  ]
}

function mapLitePlanner(steps: ExecutionPlannerLite[]): NonNullable<FreeValidationResponse["executionPlanner48h"]> {
  return steps.map((step, idx) => ({
    order: step.order ?? idx + 1,
    day: step.day,
    action: sharpenLine(step.action),
    platforms: step.platforms,
    expectedSignals: sharpenLine(step.expectedSignals),
    successIf: sharpenLine(step.successIf),
    failIf: sharpenLine(step.failIf),
  }))
}

function coercePlannerStepsForPain(
  rows: NonNullable<FreeValidationResponse["executionPlanner48h"]>,
): ExecutionPlannerLite[] {
  return rows.map((row, idx) => ({
    order: row.order ?? idx + 1,
    day: (row.day && String(row.day).trim()) || `Step ${idx + 1}`,
    action: row.action,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    expectedSignals: row.expectedSignals ?? "",
    successIf: row.successIf ?? "",
    failIf: row.failIf ?? "",
  }))
}

function normalizeExecutionPlanner48h(
  raw: unknown,
  patternFallback?: ExecutionPlannerLite[],
): NonNullable<FreeValidationResponse["executionPlanner48h"]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    if (patternFallback && patternFallback.length > 0) return mapLitePlanner(patternFallback)
    return defaultExecutionPlanner48h()
  }
  const mapped = raw
    .map((x: any, i: number) => ({
      order: typeof x?.order === "number" ? x.order : i + 1,
      day: x?.day ? String(x.day).trim() : undefined,
      action: String(x?.action || x?.step || "").trim(),
      platforms: Array.isArray(x?.platforms)
        ? x.platforms.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 8)
        : undefined,
      expectedSignals: x?.expectedSignals ? String(x.expectedSignals).trim() : undefined,
      successIf: String(x?.successIf || x?.successCondition || x?.continueIf || "").trim(),
      failIf: String(x?.failIf || x?.failureCondition || x?.pivotOrKillIf || "").trim(),
    }))
    .filter((x) => x.action.length > 0)
  return mapped.length > 0 ? mapped : defaultExecutionPlanner48h()
}

function inferCountry(idea: IdeaInput): string {
  const text = `${idea.title} ${idea.description} ${idea.targetMarket || ""} ${idea.industry || ""}`.toLowerCase()
  if (text.includes("india") || text.includes("indian") || text.includes("bharat")) return "India"
  if (text.includes("usa") || text.includes("united states") || text.includes("us ")) return "United States"
  if (text.includes("uk") || text.includes("united kingdom") || text.includes("britain")) return "United Kingdom"
  if (text.includes("uae") || text.includes("dubai") || text.includes("emirates")) return "UAE"
  return "Primary market unspecified"
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i)
  return h >>> 0
}

function insightFingerprint(outputs: Array<{ insights: string[] }>): string {
  return outputs
    .flatMap((o) => o.insights)
    .join(" ")
    .slice(0, 620)
}

function combinedRiskPool(lens: ArchetypeLens): string[] {
  const g = getArchetypeLens("generic").specificRiskPool
  return [...lens.specificRiskPool, ...g]
}

function mandateSnippetForLens(l: ArchetypeLens): string {
  return sharpenLine(l.researchMandate.split(",")[0] || l.label).toLowerCase()
}

function reasonReplacementPool(lens: ArchetypeLens): string[] {
  return [
    ...lens.pivotHints.map((p) => `${sharpenLine(p.title)}: ${sharpenLine(p.why)}`),
    ...combinedRiskPool(lens),
  ]
}

function pickPivots(lens: ArchetypeLens): { title: string; why: string }[] {
  const genericLens = getArchetypeLens("generic")
  const pool = [...lens.pivotHints, ...genericLens.pivotHints]
  const seen = new Set<string>()
  const out: { title: string; why: string }[] = []
  for (const p of pool) {
    const k = sharpenLine(p.title).toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ title: sharpenLine(p.title), why: sharpenLine(p.why) })
    if (out.length >= 3) break
  }
  return out
}

function kgReasonLine(kgNames: string[]): string {
  if (kgNames.length === 0) {
    return "No defensible KG analogues after filtering — naming fake peers is malpractice; tighten the wedge until real substitutes appear."
  }
  return `Filtered analogues (${kgNames.slice(0, 4).join(", ")}) — cite their distribution + substitution mechanics only if they truly share the bottleneck.`
}

function heuristicRiskEvidenceForLens(lens: ArchetypeLens): {
  marketEv: string[]
  marketLines: string[]
  riskEv: string[]
  riskLines: string[]
} {
  const mandateSnippet = sharpenLine(lens.researchMandate.split(",")[0] || lens.label)
  const rp = lens.specificRiskPool
  const m0 = rp[0] || "Structural demand hinge unclear without primary signals."
  const r0 = rp[1] || rp[0] || "Failure mode chain not falsified inside 48h."
  return {
    marketEv: ["Primary demand signal missing"],
    marketLines: [
      sharpenLine(`${lens.label}: structure rewards proof on ${mandateSnippet}, not generic TAM slides.`),
      sharpenLine("Falsify fast: who already pays for a substitute and what budget line funds you?"),
    ],
    riskEv: [sharpenLine(m0)],
    riskLines: [
      sharpenLine(r0),
      sharpenLine(
        `${sharpenLine(lens.judgeMandate.split(",")[0] || "Category tail risk")} stays live until instrumented.`,
      ),
    ],
  }
}

/** Fast path when Gemini is unavailable — matches pipeline structure (pattern graph, asymmetry, pain, structural). */
export function heuristicReport(idea: IdeaInput, kgCandidates: KGItem[]): FreeValidationResponse {
  const industryClassification = classifyIndustryFromIdea(idea)
  const businessDNA = extractBusinessDNAHeuristic(idea, industryClassification)
  const patternGraph = buildPatternGraph(idea, industryClassification)
  const kgFiltered = filterPlausibleKgItems(idea, kgCandidates.length ? kgCandidates : queryKnowledgeGraph(idea, 14))
  const comparablesPayload = buildMechanismAwareComparables(kgFiltered, patternGraph.historicalMatches)
  const kgLabelList = kgFiltered.map((k) => k.name)
  const archetype = patternGraph.effectiveArchetype
  const lens = getArchetypeLens(archetype)
  const seed = hashSeed(`${idea.title}|${archetype}`)
  const founderModes = resolveFounderModes(patternGraph.pattern, patternGraph.historicalMatches[0]?.id ?? null)
  const inevitSignals = filterInevitabilitySignalsForIndustry(
    deriveInevitabilitySignals(idea, patternGraph.pattern, patternGraph.historicalMatches),
    `${idea.title} ${idea.description}`,
    industryClassification,
  )
  const painSignalsHeuristic = derivePainGravitySignals(idea, patternGraph.pattern)
  const structuralViabilityHeuristic = deriveStructuralViability(
    idea,
    patternGraph.pattern,
    painSignalsHeuristic,
  )
  const anchorIdHint = patternGraph.historicalMatches[0]?.id ?? null
  const founderAsymmetrySignalsHeuristic = deriveFounderAsymmetrySignals(idea, patternGraph.pattern)
  const founderUpsideEnergyHeuristic = aggregateFounderUpsideEnergy(founderAsymmetrySignalsHeuristic)
  const founderPainReliefHeuristic = founderPainReliefForLegendNudge(founderAsymmetrySignalsHeuristic, anchorIdHint)
  const founderUpsideBoostHeuristic = founderUpsideBoost01(founderAsymmetrySignalsHeuristic)
  const heuristicExecFallback = overlayPainAwareExecution(
    overlayExecutionWedging(
      patternGraph.executionFallback48h,
      anchorIdHint,
      inevitSignals[0]?.type,
    ),
    idea,
    painSignalsHeuristic,
    patternGraph.pattern,
    seed,
  )
  const context = heuristicContext(idea)

  let topRisks = lens.specificRiskPool.slice(0, 3)
  if (topRisks.length < 3) topRisks = combinedRiskPool(lens).slice(0, 3)
  topRisks = diversifyRiskLines(
    topRisks.map((x) => sharpenLine(x)),
    combinedRiskPool(lens),
    seed,
  )

  const mandateSnippet = sharpenLine(lens.researchMandate.split(",")[0] || lens.label)
  const fastPlan = [
    "Create one landing page with a hard value proposition and paid pilot CTA.",
    "Run 20 targeted outreach messages to the exact ICP and ask for paid commitment.",
    "Kill or pivot if fewer than 3 high-intent calls are booked in 48 hours.",
  ]
  let decision: AgentLean = "PIVOT"
  const panelTally =
    anchorIdHint && LEGEND_ANCHOR_IDS.includes(anchorIdHint)
      ? { BUILD: 4, KILL: 1, PIVOT: 2 }
      : { BUILD: 2, KILL: 2, PIVOT: 3 }
  const painGateHeuristic = summarizePainGate(painSignalsHeuristic)
  decision = nudgeVerdictForInevitability(
    decision,
    anchorIdHint,
    inevitSignals,
    panelTally.BUILD,
    panelTally.KILL,
    painGateHeuristic,
    founderPainReliefHeuristic,
  )
  decision = applyPainGravityVerdictGuard(
    decision,
    idea,
    painSignalsHeuristic,
    patternGraph.pattern,
    aggregateInevitabilityWeight(inevitSignals),
    {
      anchorId: anchorIdHint,
      founderUpsideEnergy: founderUpsideEnergyHeuristic,
    },
  )
  decision = applyStructuralViabilityVerdict(decision, anchorIdHint, structuralViabilityHeuristic)
  decision = applyFounderAsymmetryVerdictCounterweight(
    decision,
    idea,
    patternGraph.pattern,
    painSignalsHeuristic,
    structuralViabilityHeuristic,
    aggregateInevitabilityWeight(inevitSignals),
    founderAsymmetrySignalsHeuristic,
    anchorIdHint,
  )
  const brutalSummaryHeuristic = diversifyMemoLanguage(
    stripMechanismTemplateText(
      decision === "BUILD"
        ? diversifiedBuildSummary(lens.label, anchorIdHint, seed + 91)
        : decision === "KILL"
          ? diversifiedKillSummary(lens.label, seed + 71)
          : diversifiedPivotSummary(lens.label, seed + 19, inevitSignals[0]?.type),
    ),
    seed + 101,
  )

  const heuristicMetrics = decompressValidationMetrics({
    opportunityScoreRaw: decision === "BUILD" ? 68 : decision === "KILL" ? 28 : 52,
    confidenceRaw: decision === "BUILD" ? 0.74 : 0.64,
    decision,
    founderUpsideBoost: founderUpsideBoostHeuristic,
    salt:
      seed ^
      hashSeed(founderModes.join("|")) ^
      hashSeed(`${structuralViabilityHeuristic.killPressureScore}|${structuralViabilityHeuristic.pivotLegitimate}`),
  })

  const judgeHint = sharpenLine(lens.judgeMandate.split(/[.;—]/)[0] || "").slice(0, 110)

  let heuristicTopReasons = [
    `Category (${lens.label}): ${mandateSnippet} must show receipts before founders fund a growth story.`,
    judgeHint ? `${judgeHint}.` : "Name buyer, substitute, and budget line — not vibes.",
    kgReasonLine(kgLabelList),
  ]
  heuristicTopReasons = heuristicTopReasons.map((x) => sharpenLine(x)).filter(Boolean)
  if (heuristicTopReasons.length < 3) {
    heuristicTopReasons.push(
      ...lens.pivotHints.map((p) => `${sharpenLine(p.title)}: ${sharpenLine(p.why)}`),
    )
  }
  heuristicTopReasons = dedupeOpeningJitter(
    diversifyRiskLines(
      heuristicTopReasons.slice(0, 5),
      reasonReplacementPool(lens),
      seed + 11,
    )
      .slice(0, 3)
      .map((r, i) => diversifyMemoLanguage(r, seed + 113 + i)),
    seed + 17,
  )

  const heuristicIfFailsBecause = diversifyMemoLanguage(
    diversifyRiskLines(
      [combinedRiskPool(lens)[0] || sharpenLine(`${lens.label} failure mode dominates before scale.`)]
        .filter(Boolean),
      combinedRiskPool(lens),
      seed + 3,
    )[0],
    seed + 119,
  )

  const heuristicRiskInsights = heuristicRiskEvidenceForLens(lens)

  let heuristicOut: FreeValidationResponse = {
    ideaSummary: `${idea.title}: ${idea.description.slice(0, 180)}`,
    ideaContext: context,
    researchInsights: [
      {
        title: scrubFrameworkResearchTitle(
          sharpenLine(`${lens.label}: mechanism check`),
          mandateSnippet,
          0,
        ),
        finding: inevitSignals[0]
          ? `${inevitSignals[0].reasoning} Surplus question: does ${mandateSnippet} amplify that pull or distract from it?`
          : `${mandateSnippet} determines whether surplus exists on the stated wedge — not headline TAM.`,
        implication: `Stress-test assumptions against ${sharpenLine(lens.judgeMandate.split(",")[0] || "category truths")}; reject template risks.`,
        confidence: heuristicMetrics.confidence * 0.95,
        sourceType: "nexus",
      },
      {
        title: scrubFrameworkResearchTitle(sharpenLine("Comparable patterns"), kgLabelList.join(" "), 1),
        finding:
          kgLabelList.length > 0
            ? `Filtered overlaps: ${kgLabelList.slice(0, 3).join(", ")} — interrogate rake, subsidy, churn, acquisition spine before copying story beats.`
            : "Analogue list withheld — hallucinating peers erodes credibility; constrain story to named substitutes founders already pay.",
        implication: heuristicTopReasons[1] || "Map substitute workflow before declaring whitespace.",
        confidence: 0.55,
        sourceType: "kg",
      },
    ],
    agentInsights: [
      {
        agent: "MarketResearchAgent",
        stance: "mixed",
        confidence: 0.66,
        evidence: heuristicRiskInsights.marketEv,
        insights: heuristicRiskInsights.marketLines,
        verdictLean: "PIVOT",
      },
      {
        agent: "RiskFailureAgent",
        stance: "critical",
        confidence: 0.84,
        evidence: heuristicRiskInsights.riskEv,
        insights: heuristicRiskInsights.riskLines,
        verdictLean: "KILL",
      },
    ],
    whyThisIdeaWillLikelyFail: topRisks,
    fastestWayToProveWrong48h: fastPlan,
    executionPlan: fastPlan,
    executionPlanner48h: mapLitePlanner(diversifyExecutionLexicon(heuristicExecFallback, seed + 31)),
    keyRisks: topRisks,
    opportunityScore: heuristicMetrics.opportunityScore,
    finalVerdict: {
      decision,
      brutalSummary: brutalSummaryHeuristic,
      ifWorksBecause: lens.pivotHints[0]
        ? sharpenLine(`${lens.pivotHints[0].title}: ${lens.pivotHints[0].why}`)
        : sharpenLine("A narrow wedge with measurable buyer pull can fund the next sprint before scale."),
      ifFailsBecause: heuristicIfFailsBecause,
      confidence: heuristicMetrics.confidence,
      topReasons: heuristicTopReasons,
      topRisks,
    },
    classification: classifyFromDecision(decision),
    score: Number(((heuristicMetrics.opportunityScore) / 10).toFixed(1)),
    summary: brutalSummaryHeuristic,
    topRisks,
    pivots: pickPivots(lens),
    comparables: comparablesPayload,
    tamSamSom: {
      TAM: "Heuristic estimate only",
      SAM: "Needs real customer discovery",
      SOM: "Uncertain without GTM proof",
      confidence: "low",
      assumptions: ["No external paid data sources used."],
    },
    metadata: {
      sourceKeysUsed: ["gemini-v2", "local-kg-v1"],
      cached: false,
      generatedAt: new Date().toISOString(),
      needsReview: false,
      needsReviewReason: null,
      enginePath: "heuristic_fallback",
      businessDNA,
    },
  }

  heuristicOut = sanitizeFreeValidationLanguage(heuristicOut, industryClassification)
  heuristicOut = attachCognitionAudit(heuristicOut, industryClassification)
  heuristicOut = {
    ...heuristicOut,
    metadata: {
      ...heuristicOut.metadata,
      industryClassification,
      enginePath: "heuristic_fallback",
      businessDNA,
    },
  }
  return FreeValidationResponseSchema.parse(heuristicOut)
}

function agentPrompt(opts: {
  role: string
  ideaContext: IdeaContextLite
  researchInsights: ResearchInsightLite[]
  contradictionHints: string[]
  lens: ArchetypeLens
  archetypeKey: StartupArchetype
  repeatGuard: string
  patternMechanics: string
  founderModesBrief: string
  asymmetryBrief: string
  founderAsymmetryBrief: string
  painGravityBrief: string
  structuralBrief: string
  domainRoutingBlock: string
}): string {
  const {
    role,
    ideaContext,
    researchInsights,
    contradictionHints,
    lens,
    archetypeKey,
    repeatGuard,
    patternMechanics,
    founderModesBrief,
    asymmetryBrief,
    founderAsymmetryBrief,
    painGravityBrief,
    structuralBrief,
    domainRoutingBlock,
  } = opts

  const styleByRole: Record<string, string> = {
    MarketResearchAgent:
      "Style: macro + adoption structure — densities, substitutes, urgency, segment migration.",
    CompetitorAgent:
      "Style: saturation hunter — suites, clones, multi-homing, asymmetric responses.",
    MonetizationAgent:
      "Style: P&L realist — rake, seats, breakage, subsidy math, procurement cadence.",
    FeasibilityAgent:
      "Style: systems engineer — integrations, SLA, logistics, capex tails, regulated flows.",
    ICPAgent:
      "Style: behavioral clinician — inertia, rituals, sabotage incentives, embarrassment costs.",
    RiskFailureAgent:
      "Style: prosecutor — existential tails, cascading failures, hidden asymmetry.",
    ValidationStrategyAgent:
      "Style: operator — prepaid tests, LOIs, sharp pass/kill thresholds in <72h.",
  }

  const specialization =
    lens.agentTension[role] ||
    "Lead with vocabulary only your function would use — not recycled founder clichés."

  return `${domainRoutingBlock}

You are ${role}, one specialist seat on a VERDIKT adversarial council.
Council members contradict by default; unanimous cheerleading fails the exercise.

Return strict JSON ONLY:
{"insights": string[], "evidence": string[], "confidence": number, "verdictLean":"BUILD|PIVOT|KILL", "stance":"supportive|critical|mixed"}

STARTUP_ARCHETYPE: ${lens.label} (${archetypeKey})
CATEGORY_CONTRACT: ${lens.researchMandate}

STARTUP_PATTERN_GRAPH:
${patternMechanics}

FOUNDER_MODE_ENGINE — adopt this cognition (not consultant neutrality):
${founderModesBrief}

ASYMMETRY / INEVITABILITY:
${asymmetryBrief}

FOUNDER_ASYMMETRY (upside counterweight — separate behavior-changing novelty from slide-deck novelty):
${founderAsymmetryBrief}

PAIN_GRAVITY (operational necessity > narrative polish):
${painGravityBrief}

STRUCTURAL (PIVOT only if underlying demand is durable; otherwise KILL):
${structuralBrief}

ROLE_SPECIALIZATION (obey verbatim):
${specialization}

WAVE_ANTICOLLAPSE:
- Never restate critiques that equally describe unrelated archetypes unless IdeaContext proves that failure mode locally.
${
  repeatGuard.trim().length === 0
    ? `- Wave 1 stakes: set sharp, falsifiable hypotheses about THIS archetype — later seats will butcher them.`
    : `- Forbidden parroting/mimicry of prior wave language. Extract for overlap check only:\n<<<${repeatGuard}>>>\nCritique DIFFERENT dimensions with different nouns + verbs.`
}

BANNED stock fragments unless IdeaContext proves that exact causal chain:
"distribution assumptions are weak","differentiation copied","wtp unproven","willingness to pay","paid intent unproven","market noise","thesis stays blind","category-native proofs land in 48h".

TEMPLATE_LEAK_BAN unless collaboration is central to claimed pain:
"screen share","invite teammates","organic invites","instrument the invite loop","recipient-side signup" — use workaround diaries, removal tests, or prepaid wedges instead when pain is solo/AI-wrapper/episodic.

Rules:
- 3–5 insights; cite stakeholder/geo/substitute/budget/density specifics where possible.
- Each response includes ONE falsifiable test with quantitative kill metric.
- verdictLean SHOULD follow ROLE_SPECIALIZATION lean hints whenever evidence allows.
- Ban soft fillers: ${`"promising","has potential"`}.
${styleByRole[role] || "Style: decisive specialist."}

IdeaContext: ${JSON.stringify(ideaContext)}
ResearchInsights: ${JSON.stringify(researchInsights)}
ContradictionHints: ${JSON.stringify(contradictionHints)}`
}

export async function runFreeValidationPipeline(idea: IdeaInput): Promise<FreeValidationResponse> {
  const industryClassification = classifyIndustryFromIdea(idea)
  const businessDNA = await extractBusinessDNA(idea, industryClassification)
  const domainRoutingBlock = [
    `INDUSTRY_CLASSIFICATION primary=${industryClassification.primaryVertical} secondary=${industryClassification.secondaryVertical ?? "none"} confidence=${industryClassification.confidence01.toFixed(2)} businessModel=${industryClassification.businessModel} operationalStructure=${industryClassification.operationalStructure} complexity=${industryClassification.complexityType} buyer=${industryClassification.buyerType} deployment=${industryClassification.deploymentModel}`,
    formatBusinessDNAForPrompt(businessDNA),
    formatDomainPackForPrompt(industryClassification.primaryVertical),
    domainLanguageContract(industryClassification),
  ].join("\n\n")

  const kgCandidates = queryKnowledgeGraph(idea, 14)
  const patternGraph = buildPatternGraph(idea, industryClassification)
  const kgFiltered = filterPlausibleKgItems(idea, kgCandidates)
  const comparablesPayload = buildMechanismAwareComparables(kgFiltered, patternGraph.historicalMatches)
  const kgNamesForPrompts = kgFiltered.slice(0, 6).map((k) => k.name)
  const founderModes = resolveFounderModes(patternGraph.pattern, patternGraph.historicalMatches[0]?.id ?? null)
  const founderAgentBrief = founderModesAgentBrief(founderModes)
  const founderJudgeBrief = founderModesJudgeBrief(founderModes, patternGraph.pattern)
  const founderExecGrain = founderModeExecutionGrain(founderModes)
  const inevitSignals = filterInevitabilitySignalsForIndustry(
    deriveInevitabilitySignals(idea, patternGraph.pattern, patternGraph.historicalMatches),
    `${idea.title} ${idea.description}`,
    industryClassification,
  )
  const painSignals = derivePainGravitySignals(idea, patternGraph.pattern)
  const structuralViability = deriveStructuralViability(idea, patternGraph.pattern, painSignals)
  const structuralAgentBrief = structuralViabilityAgentBrief(structuralViability)
  const painGateSnapshot = summarizePainGate(painSignals)
  const anchorId = patternGraph.historicalMatches[0]?.id ?? null
  const founderAsymmetrySignals = deriveFounderAsymmetrySignals(idea, patternGraph.pattern)
  const founderUpsideEnergy = aggregateFounderUpsideEnergy(founderAsymmetrySignals)
  const founderAsymmetryAgentBlock = founderAsymmetryBriefForAgents(founderAsymmetrySignals)
  const founderAsymmetryJudgeBlock = founderAsymmetryJudgeAddendum(founderAsymmetrySignals)
  const founderUpsideBoost = founderUpsideBoost01(founderAsymmetrySignals)
  const legendPainRelief = founderPainReliefForLegendNudge(founderAsymmetrySignals, anchorId)
  const planDiversitySeed = hashSeed(
    `${idea.title}|${patternGraph.effectiveArchetype}|${idea.description.slice(0, 96)}`,
  )
  const asymmetryAgentBlock = asymmetryBriefForAgents(inevitSignals)
  const painGravityAgentBlock = painGravityBriefForAgents(idea, painSignals)
  const execFallbackWedged = overlayPainAwareExecution(
    overlayExecutionWedging(
      patternGraph.executionFallback48h,
      anchorId,
      inevitSignals[0]?.type,
    ),
    idea,
    painSignals,
    patternGraph.pattern,
    planDiversitySeed,
  )

  try {
    const archetypeKey = patternGraph.effectiveArchetype
    const lens = getArchetypeLens(archetypeKey)
    const diversificationSeed = hashSeed(`${idea.title}|${archetypeKey}|${idea.description.slice(0, 96)}`)
    const riskPool = combinedRiskPool(lens)
    const reasonPool = reasonReplacementPool(lens)

    const contextRaw = await generateGeminiJson(
      `${domainRoutingBlock}

Extract IdeaContext JSON with keys:
{"problem","targetUser","market","coreIdea","keywords","searchQueries","missingAssumptions","validationGaps"}.

STARTUP_ARCHETYPE_HINT: ${lens.label} (${archetypeKey})
ARCHETYPE_FOCUS: ${lens.researchMandate}

Tailor missingAssumptions + validationGaps to DOMAIN_NATIVE failure modes from INDUSTRY_CLASSIFICATION — never generic SaaS templates unless domain is horizontal SaaS.

STARTUP_PATTERN_GRAPH:
${patternGraph.mechanismBrief}
Execution guardrails:
${patternGraph.executionBrief}

FOUNDER_MODES (${founderModes.join(" · ")}) — missingAssumptions/validationGaps must sound uncomfortable and specific.
${founderAgentBrief.slice(0, 1800)}

FOUNDER_ASYMMETRY_ENGINE (counterweight committee risk — irrational-today ↔ obvious-later; not hype):
${founderAsymmetryAgentBlock.slice(0, 1900)}

${asymmetryInstructionForIndustry(industryClassification)}
${asymmetryAgentBlock.slice(0, 2000)}

PAIN_GRAVITY — distinguish intellectual excitement from recurring operational pain:
${painGravityAgentBlock.slice(0, 1800)}

STRUCTURAL_VIABILITY (PIVOT = fix real market; KILL = market is fake):
${structuralAgentBrief.slice(0, 900)}
Input: ${JSON.stringify(idea)}`,
    )
    const ideaContext = {
      ...heuristicContext(idea),
      ...contextRaw,
    }
    const country = inferCountry(idea)

    const researchRaw = await generateGeminiJson(
      `${domainRoutingBlock}

VERDIKT Nexus Orchestrator — consulting-grade, archetype-native research.
Never output vacuous lines like "market noise exists" or "evidence quality is weak without signals".

TITLE_VIVID_RULES:
- Forbidden canned titles: "Mechanism check", "Comparable patterns", anything starting with "Category:" — those read like McKinsey Mad Libs.
- Each title ≤8 words, sharp enough that a cynical partner remembers it an hour later.
- At least TWO insight blocks must cite a causal chain ONLY this idea archetype cares about — not transferable platitudes.

Return strict JSON:
{
  "researchInsights":[
    {
      "title":"string",
      "country":"string",
      "trendObservation":"string",
      "whyItMatters":"string",
      "strategicImplication":"string",
      "opportunityAngle":"string",
      "finding":"string",
      "implication":"string",
      "confidence": number,
      "sourceType":"nexus|gemini-simulated|kg"
    }
  ],
  "contradictionsToProbe": string[]
}

STARTUP_ARCHETYPE: ${lens.label} (${archetypeKey})
CATEGORY_FOCUS: ${lens.researchMandate}

STARTUP_PATTERN_GRAPH:
${patternGraph.mechanismBrief}

ASYMMETRY_LAYER:
${asymmetryAgentBlock.slice(0, 2000)}

FOUNDER_ASYMMETRY_LAYER (desire pull, friction demolition, timing hinge, simplicity — vs fake novelty):
${founderAsymmetryAgentBlock.slice(0, 1900)}

PAIN_GRAVITY_LAYER (recurrence · severity · workarounds · removal test):
${painGravityAgentBlock.slice(0, 1800)}

STRUCTURAL_VIABILITY_LAYER:
${structuralAgentBrief.slice(0, 900)}

Rules:
- Each insight must cite ${country} AND at least one primitive that is believable for INDUSTRY_CLASSIFICATION (use DOMAIN_PACK vocabulary — not interchangeable marketplace tropes unless domain is marketplaces).
- Ban hollow macro praise; every field must contain a falsifiable claim hook.
- contradictionsToProbe must juxtapose optimistic vs catastrophic readings grounded in this archetype — include at least ONE pair framed as "manual behavior already exists vs still fantasy".

Context:
IdeaContext=${JSON.stringify(ideaContext)}
FILTERED_KG_ANALOGUES=${JSON.stringify(kgNamesForPrompts)}
RULE: If FILTERED_KG_ANALOGUES is empty DO NOT hallucinate recognizable company names — state honestly that overlaps failed quality bar.

If empirical data is scarce, produce high-fidelity simulated hypotheses and label sourceType gemini-simulated.`,
    )
    const researchInsights = Array.isArray(researchRaw?.researchInsights)
      ? researchRaw.researchInsights.map((insight: ResearchInsightLite, idx: number) =>
          normalizeResearchInsight(insight, country, idx),
        )
      : []
    const contradictionHints = Array.isArray(researchRaw?.contradictionsToProbe) ? researchRaw.contradictionsToProbe : []

    const agentRolesOrdered = [
      "MarketResearchAgent",
      "CompetitorAgent",
      "MonetizationAgent",
      "FeasibilityAgent",
      "ICPAgent",
      "RiskFailureAgent",
      "ValidationStrategyAgent",
    ]

    const wave1 = ["MarketResearchAgent", "CompetitorAgent", "MonetizationAgent"] as const
    const wave2 = ["FeasibilityAgent", "ICPAgent", "RiskFailureAgent", "ValidationStrategyAgent"] as const

    const baseAgentOpts = {
      ideaContext,
      researchInsights,
      contradictionHints,
      lens,
      archetypeKey,
      patternMechanics: patternGraph.mechanismBrief,
      founderModesBrief: founderAgentBrief,
      asymmetryBrief: asymmetryAgentBlock,
      founderAsymmetryBrief: founderAsymmetryAgentBlock,
      painGravityBrief: painGravityAgentBlock,
      structuralBrief: structuralAgentBrief,
      domainRoutingBlock,
    }

    const wave1Outputs = await Promise.all(
      wave1.map(async (role) => {
        const raw = await generateGeminiJson(
          agentPrompt({
            role,
            ...baseAgentOpts,
            repeatGuard: "",
          }),
        )
        return normalizeAgentPayload(role, raw)
      }),
    )

    const repeatFingerprint = insightFingerprint(wave1Outputs)

    const wave2Outputs = await Promise.all(
      wave2.map(async (role) => {
        const raw = await generateGeminiJson(
          agentPrompt({
            role,
            ...baseAgentOpts,
            repeatGuard: repeatFingerprint,
          }),
        )
        return normalizeAgentPayload(role, raw)
      }),
    )

    const assembled = new Map<string, ReturnType<typeof normalizeAgentPayload>>()
    wave1.forEach((role, idx) => assembled.set(role, wave1Outputs[idx]))
    wave2.forEach((role, idx) => assembled.set(role, wave2Outputs[idx]))
    let outputs = agentRolesOrdered.map((role) => assembled.get(role)!)

    outputs = outputs.map((o) => {
      if (o.agent !== "RiskFailureAgent") return o
      return { ...o, stance: "critical" as const }
    })

    if (!outputs.some((o) => o.agent === "RiskFailureAgent")) {
      outputs.push({
        agent: "RiskFailureAgent",
        stance: "critical",
        confidence: 0.86,
        evidence: [sharpenLine(riskPool[diversificationSeed % riskPool.length])],
        insights: [
          sharpenLine(`${lens.label}: ${riskPool[(diversificationSeed + 1) % riskPool.length]}`),
          sharpenLine(`${mandateSnippetForLens(lens)} remains unpriced until catastrophic tail is instrumented.`),
        ],
        verdictLean: "KILL",
      })
    }

    const spreadCount = agentVerdictSpreadCount(outputs)
    const spreadNote =
      spreadCount < 3
        ? `VERDICT_SPREAD_ALERT (${spreadCount} unique leans) — escalate explicit disagreement inside topReasons + ifFailsBecause.`
        : `VERDICT_SPREAD_OK (${spreadCount}) — reconcile tension without collapsing into generic skepticism.`

    const judgeRaw = await generateGeminiJson(
      `${domainRoutingBlock}

FinalJudgeAgent — resolve hostile VERDIKT specialists + Nexus insights.

Return strict JSON ONLY:
{"decision":"BUILD|PIVOT|KILL","brutalSummary":string,"ifWorksBecause":string,"ifFailsBecause":string,"confidence":number,"topReasons":string[],"topRisks":string[],"opportunityScore":number,"whyFail":string[],"proveWrong48h":string[],"executionPlan":string[],"executionPlanner48h":[{"order":1,"day":string,"action":string,"platforms":string[],"expectedSignals":string,"successIf":string,"failIf":string}]}

STARTUP_ARCHETYPE: ${lens.label} (${archetypeKey})
JUDGE_CATEGORY_MANDATE: ${lens.judgeMandate}
SPREAD_NOTE: ${spreadNote}

STARTUP_PATTERN_GRAPH:
${patternGraph.mechanismBrief}

VERDICT_CONVICTION_GUIDE:
${patternGraph.verdictPressureBrief}

EXECUTION_REALISM_GUIDE:
${patternGraph.executionBrief}

FOUNDER_COHORT_COGNITION:
${founderJudgeBrief}

EXECUTION_GRAIN (${founderModes.join(", ")}):
${founderExecGrain}

${asymmetryJudgeAddendum(inevitSignals, anchorId)}

${founderAsymmetryJudgeBlock}

${painGravityJudgeAddendum(idea, painSignals)}

${structuralViabilityJudgeAddendum(structuralViability)}

Synthesis rules — NOT averaging away tension:
- If MarketResearchAgent leaned BUILD yet RiskFailureAgent leaned KILL, both mechanisms must survive in condensed form (no vague compromise).
${spreadCount < 3 ? "- Spread is LOW: surface explicit polarity between specialists inside topReasons." : "- Spread healthy: crystallize disagreement into tradeoffs."}

Banned template clichés unless IdeaContext proves exact mechanism:
"distribution assumptions are weak","differentiation copied","paid intent","wtp","market noise".

Banned investor-memo rhythm unless literally required:
"scale narrative","growth story","show receipts","workflow cadence","tighten the wedge","investor curiosity","named first buyer","instrumented" — vary language (use concrete nouns: buyer title, budget line, ship date, fraud, rake, density).

JUDGE_FOUNDER_ASYMMETRY:
- Is this merely risky, or the kind of idea skeptics misread because they overfit TODAY's equilibrium behavior?
- Would early cynics underestimate emotional pull / friction demolition / normalization path?
- Keep delusion resistance: fake novelty + thin AI wrappers still die.

Style:
- brutalSummary ≤ 26 words and must differ in RHYTHM from other ideas (no shared clause across categories).
- ifWorksBecause + ifFailsBecause = one sentence each, grounded in INDUSTRY_CLASSIFICATION + DOMAIN_PACK (use native vocabulary — ban liquidity/rake/invite talk unless domain is marketplaces or explicitly two-sided).
- topReasons (≤3 quotes, ≤18 words) must cite different mechanisms — never duplicate topRisks phrasing verbatim.
- topRisks (≤5 bullets) enumerate DISTINCT failure pathways.
- forbid maybe/might/could/possible/potentially.

executionPlanner48h: 4-6 steps spanning 48h — each with day tag, concrete action, platforms[], expectedSignals, successIf, failIf.
- Plans must map to the enumerated distribution primitive (supply-side, bottoms-up PLG, sales-led, viral/creator, etc.).
- PAIN_ANCHORING: Day-1 action must observe real recurrence (diary of manual hacks, removal test, prepaid pilot, or marketplace liquidity deposit) — NOT default collab boilerplate unless pain is multi-player.
- Honour EXECUTION_GRAIN — if motion could apply unchanged to fifteen random SaaS decks, rip it up and regenerate.
- No “operator theater” filler: forbid generic Zoom interview marathons unless you specify what shameful hypothesis they kill with numbers.
- For AI wrappers / dashboards / deck tools: require paid pilot or workaround capture before any “scale” language.

Evidence bundle:
AgentOutputs=${JSON.stringify(outputs)}
ResearchInsights=${JSON.stringify(researchInsights)}
IdeaContext=${JSON.stringify(ideaContext)}`,
    )

    let decision: AgentLean = (judgeRaw?.decision || "PIVOT") as AgentLean
    decision = rebalanceVerdictFromPanel(decision, outputs)
    const panelTallyLean = tallyPanelLean(outputs)
    decision = nudgeVerdictForInevitability(
      decision,
      anchorId,
      inevitSignals,
      panelTallyLean.BUILD,
      panelTallyLean.KILL,
      painGateSnapshot,
      legendPainRelief,
    )
    decision = applyPainGravityVerdictGuard(
      decision,
      idea,
      painSignals,
      patternGraph.pattern,
      aggregateInevitabilityWeight(inevitSignals),
      { anchorId, founderUpsideEnergy },
    )
    decision = applyStructuralViabilityVerdict(decision, anchorId, structuralViability)
    decision = applyFounderAsymmetryVerdictCounterweight(
      decision,
      idea,
      patternGraph.pattern,
      painSignals,
      structuralViability,
      aggregateInevitabilityWeight(inevitSignals),
      founderAsymmetrySignals,
      anchorId,
    )

    let topRisks = enforceHardLanguage(
      Array.isArray(judgeRaw?.topRisks) ? judgeRaw.topRisks.slice(0, 5) : [],
    ).map((x) => sharpenLine(x))
    topRisks = diversifyRiskLines(topRisks, riskPool, diversificationSeed)

    let topReasons = enforceHardLanguage(
      (Array.isArray(judgeRaw?.topReasons) && judgeRaw.topReasons.length > 0
        ? judgeRaw.topReasons
        : ["Panel returned brittle synthesis — escalate falsification fidelity."]
      ).slice(0, 3),
    ).map((x) => sharpenLine(x))
    topReasons = diversifyRiskLines(topReasons, reasonPool, diversificationSeed + 17).slice(0, 3)

    const brutalFallback = stripMechanismTemplateText(
      decision === "KILL"
        ? diversifiedKillSummary(lens.label, diversificationSeed + 3)
        : decision === "PIVOT"
          ? diversifiedPivotSummary(
              lens.label,
              diversificationSeed + 7,
              inevitSignals[0]?.type,
            )
          : diversifiedBuildSummary(lens.label, anchorId, diversificationSeed + 11),
    )

    let brutalSummary = stripMechanismTemplateText(String(judgeRaw?.brutalSummary || "").trim() || brutalFallback)
    if (!brutalSummary || brutalSummary.length < 12) brutalSummary = brutalFallback

    let ifWorksBecause = stripMechanismTemplateText(
      enforceHardLanguage([
        String(judgeRaw?.ifWorksBecause || "").trim() ||
          (decision === "BUILD"
            ? sharpenLine(lens.pivotHints[0]?.why || mandateSnippetForLens(lens))
            : decision === "PIVOT"
              ? sharpenLine(
                  lens.pivotHints[1]?.why ||
                    `Ship ${mandateSnippetForLens(lens)} proof loops before widening scope.`,
                )
              : sharpenLine("Earn resurrection via prepaid wedge + sharper buyer roster before resurfacing hype.")),
      ])[0],
    )

    let whyFailLines = enforceHardLanguage(
      Array.isArray(judgeRaw?.whyFail) && judgeRaw.whyFail.length > 0
        ? judgeRaw.whyFail.map(String)
        : [...topRisks],
    ).map((x) => sharpenLine(x))
    whyFailLines = diversifyRiskLines(whyFailLines, riskPool, diversificationSeed + 29)

    const ifFailsSeed = diversifyRiskLines(
      [topRisks[0] || riskPool[diversificationSeed % riskPool.length]],
      riskPool,
      diversificationSeed + 5,
    )[0]
    let ifFailsBecause = stripMechanismTemplateText(
      enforceHardLanguage([String(judgeRaw?.ifFailsBecause || "").trim() || sharpenLine(ifFailsSeed)])[0],
    )

    brutalSummary = diversifyMemoLanguage(brutalSummary, diversificationSeed + 101)
    ifWorksBecause = diversifyMemoLanguage(ifWorksBecause, diversificationSeed + 103)
    ifFailsBecause = diversifyMemoLanguage(ifFailsBecause, diversificationSeed + 107)
    topReasons = dedupeOpeningJitter(
      topReasons.map((r, i) => diversifyMemoLanguage(r, diversificationSeed + 109 + i)),
      diversificationSeed + 13,
    )

    const curatedTopRisks =
      topRisks.length > 0 ? topRisks : diversifyRiskLines([riskPool[0]], riskPool, diversificationSeed + 41)

    const plannerNormalized = normalizeExecutionPlanner48h(judgeRaw?.executionPlanner48h, execFallbackWedged)
    const plannerAfterPain = mapLitePlanner(
      diversifyExecutionLexicon(
        overlayPainAwareExecution(
          coercePlannerStepsForPain(plannerNormalized),
          idea,
          painSignals,
          patternGraph.pattern,
          diversificationSeed,
        ),
        diversificationSeed + 31,
      ),
    )

    const verdictMetrics = decompressValidationMetrics({
      opportunityScoreRaw: Number(judgeRaw?.opportunityScore ?? 50),
      confidenceRaw: Number(judgeRaw?.confidence ?? 0.65),
      decision,
      founderUpsideBoost,
      salt:
        diversificationSeed ^
        hashSeed(founderModes.join("|")) ^
        hashSeed(inevitSignals.map((s) => s.type).join(":")) ^
        hashSeed(painSignals.map((s) => `${s.type}:${s.strength}`).join("|")) ^
        hashSeed(
          `${structuralViability.killPressureScore}|${structuralViability.rationaleLines.slice(0, 3).join(";")}`,
        ),
    })

    let response: FreeValidationResponse = {
      ideaSummary: `${idea.title}: ${idea.description.slice(0, 180)}`,
      ideaContext,
      researchInsights: researchInsights.slice(0, 6),
      agentInsights: outputs,
      opportunityScore: Math.max(0, Math.min(100, verdictMetrics.opportunityScore)),
      finalVerdict: {
        decision,
        brutalSummary,
        ifWorksBecause,
        ifFailsBecause,
        confidence: clampConfidence(verdictMetrics.confidence),
        topReasons,
        topRisks: curatedTopRisks,
      },
      whyThisIdeaWillLikelyFail: whyFailLines.slice(0, 5),
      fastestWayToProveWrong48h: Array.isArray(judgeRaw?.proveWrong48h)
        ? judgeRaw.proveWrong48h.slice(0, 5)
        : [],
      executionPlan: (judgeRaw?.executionPlan || []).slice(0, 6),
      executionPlanner48h: plannerAfterPain,
      classification: classifyFromDecision(decision),
      score: Number(((verdictMetrics.opportunityScore) / 10).toFixed(1)),
      summary: brutalSummary,
      topRisks: curatedTopRisks,
      pivots: pickPivots(lens),
      comparables: comparablesPayload,
      tamSamSom: {
        TAM: "Research-backed estimate pending external validation",
        SAM: "Narrow segment to be validated with outreach",
        SOM: "Derived from 48h tests + first pilots",
        confidence: "low",
        assumptions: ["Gemini-generated strategic estimates; validate with primary data."],
      },
      metadata: {
        sourceKeysUsed: ["gemini-v2", "local-kg-v1"],
        cached: false,
        generatedAt: new Date().toISOString(),
        needsReview: false,
        needsReviewReason: null,
        enginePath: "gemini_pipeline",
        businessDNA,
      },
    }
    response = sanitizeFreeValidationLanguage(response, industryClassification)
    response = attachCognitionAudit(response, industryClassification)
    response = {
      ...response,
      metadata: {
        ...response.metadata,
        industryClassification,
        enginePath: "gemini_pipeline",
        businessDNA,
      },
    }
    return FreeValidationResponseSchema.parse(response)
  } catch {
    return FreeValidationResponseSchema.parse(heuristicReport(idea, kgCandidates))
  }
}
