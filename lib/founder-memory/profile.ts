import type {
  FounderArchetype,
  FounderProfileSnapshot,
  AsymmetryPainBalance,
  RealismTier,
  RiskPostureLabel,
  TimelineEvent,
  VerdictLean,
  ValidationVerdictEvent,
  ExperimentEvent,
  ReportFeedbackEvent,
} from "@/lib/founder-memory/types"

const VIRALISH = /\b(viral|invite loop|invite|organic growth|tiktok|network effect|loops?)\b/i
const AISKIN = /\b(gpt|openai|llm|copilot|genai|generative ai|prompt|chatgpt|ai wrapper|wrapper)\b/i
const DISTRIBUTIONISH = /\b(outbound|cold email|linkedin|distribution|sales|gtm|icp|waitlist\s+converted|pricing|paid\s+pilot)\b/i
const PAINOPS = /\b(workflow|ops|sla|manual|integrations?|billing|invoice|inventory|supply chain|ticket|on-?call)\b/i
const MARKETPLACEISH = /\b(marketplace|two-?sided|liquidity|rake|supply|demand|riders|hosts)\b/i
const INFRA = /\b(api|infra|sdk|payments api|devtools|stripe|embedding|saas)\b/i

function tagBuckets(text: string): Set<string> {
  const tags = new Set<string>()
  if (VIRALISH.test(text)) tags.add("viral_geometry")
  if (AISKIN.test(text)) tags.add("ai_adjacent_skin")
  if (DISTRIBUTIONISH.test(text)) tags.add("distribution_language")
  if (PAINOPS.test(text)) tags.add("ops_workflow_anchor")
  if (MARKETPLACEISH.test(text)) tags.add("marketplace_geometry")
  if (INFRA.test(text)) tags.add("infra_dev_surface")
  return tags
}

function inferArchetype(tagCounts: Map<string, number>, verdictRatio: { build: number; total: number }): FounderArchetype {
  const pick = (k: string) => tagCounts.get(k) ?? 0
  if (verdictRatio.total < 2) return "unclear"
  if (pick("ai_adjacent_skin") >= 2 && pick("ops_workflow_anchor") <= 1) return "ai_adjacent"
  if (pick("marketplace_geometry") >= 2) return "marketplace_leaning"
  if (pick("infra_dev_surface") >= 2 && pick("viral_geometry") <= 1) return "infra_workflow"
  if (pick("viral_geometry") + pick("distribution_language") >= pick("ops_workflow_anchor") + 1) return "gtm_heavy"
  if (pick("ops_workflow_anchor") >= 2) return "product_heavy"
  return "unclear"
}

function riskPosture(counts: Record<VerdictLean, number>): RiskPostureLabel {
  const t = counts.BUILD + counts.PIVOT + counts.KILL
  if (t < 3) return "balanced"
  const b = counts.BUILD / t
  const k = counts.KILL / t
  if (b >= 0.45 && k <= 0.25) return "risk_on"
  if (k >= 0.35) return "risk_off"
  return "balanced"
}

function asymmetryBalance(tagCounts: Map<string, number>): AsymmetryPainBalance {
  const v = (tagCounts.get("viral_geometry") ?? 0) + (tagCounts.get("ai_adjacent_skin") ?? 0)
  const p = (tagCounts.get("ops_workflow_anchor") ?? 0) + (tagCounts.get("distribution_language") ?? 0) * 0.5
  if (v + p < 2) return "unknown"
  if (v > p + 1) return "tilt_asymmetry"
  if (p > v + 1) return "tilt_pain"
  return "balanced"
}

const WEAK_SIGNAL = /\b(nobody|no\s+one|silence|no\s+clicks?|zero\s+replies?|ghost|ignored|low\s+intent|waitlist\s+only|vanity)\b/i
const STRONG_SIGNAL = /\b(paid|deposit|pilot|signed|retention|repeat|referr|high\s+intent|activated)\b/i

function operationalRealismFromExperiments(experiments: ExperimentEvent[]): RealismTier {
  if (experiments.length < 2) return "medium"
  let weak = 0
  let strong = 0
  for (const e of experiments) {
    const blob = `${e.outcome} ${e.learnings}`.toLowerCase()
    if (WEAK_SIGNAL.test(blob)) weak++
    if (STRONG_SIGNAL.test(blob)) strong++
  }
  if (weak >= 2 && strong <= 1) return "low"
  if (strong >= 2) return "high"
  return "medium"
}

/** Top recurring tags as readable short labels */
function topTags(tagCounts: Map<string, number>, max: number): string[] {
  return [...tagCounts.entries()]
    .filter(([k]) => k !== "")
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k.replace(/_/g, " "))
}

function executionWeakSignals(experiments: ExperimentEvent[]): string[] {
  const out: string[] = []
  let vague = 0
  let noMetric = 0
  for (const e of experiments) {
    const a = e.actionTaken.toLowerCase()
    if (a.length < 18 || /\b(marketing|survey|linkedin|twitter|waitlist signup)\b/i.test(a)) vague++
    if (!/\d/.test(`${e.outcome}${e.learnings}`)) noMetric++
  }
  if (vague >= 2) out.push("actions often stay high-level before numeric kill criteria appear")
  if (noMetric >= 2) out.push("outcomes seldom carry counts or decisive thresholds yet")
  return out.slice(0, 5)
}

function gtmSignals(experiments: ExperimentEvent[], excerpts: string): string[] {
  const blob = excerpts.toLowerCase()
  const out: string[] = []
  if (experiments.some((e) => WEAK_SIGNAL.test(`${e.outcome} ${e.learnings}`))) {
    out.push("distribution tests sometimes return silence — worth tightening ICP before widening copy")
  }
  if (/viral|invite loop|loops?/i.test(blob) && !/paid|pilot/i.test(blob)) {
    out.push("ideas lean on geometric growth verbs before anchored paid motion shows up")
  }
  return out.slice(0, 5)
}

function revalidationCount(events: TimelineEvent[]): number {
  const seen = new Map<string, number>()
  for (const e of events) {
    if (e.kind !== "validation_verdict") continue
    seen.set(e.ideaId, (seen.get(e.ideaId) ?? 0) + 1)
  }
  let c = 0
  for (const n of seen.values()) if (n > 1) c += n - 1
  return c
}

/** Deterministic snapshot from timeline only — never calls an LLM. */
export function deriveFounderProfile(timeline: TimelineEvent[]): FounderProfileSnapshot {
  const verdicts = timeline.filter((e): e is ValidationVerdictEvent => e.kind === "validation_verdict")
  const experiments = timeline.filter((e): e is ExperimentEvent => e.kind === "experiment")
  const feedback = timeline.filter((e): e is ReportFeedbackEvent => e.kind === "report_feedback")

  const counts: Record<VerdictLean, number> = { BUILD: 0, PIVOT: 0, KILL: 0 }
  const tagTotals = new Map<string, number>()
  let excerpts = ""

  for (const v of verdicts) {
    counts[v.verdict] += 1
    const blob = `${v.ideaTitle}. ${v.ideaExcerpt}`
    excerpts += `\n${blob}`
    for (const t of tagBuckets(blob.toLowerCase())) {
      tagTotals.set(t, (tagTotals.get(t) ?? 0) + 1)
    }
  }

  const total = counts.BUILD + counts.PIVOT + counts.KILL
  const archetype = inferArchetype(tagTotals, { build: counts.BUILD, total })

  const recurringIdeaTags = topTags(tagTotals, 8)
  const executionWeaknesses = executionWeakSignals(experiments)
  const gtmMistakes = gtmSignals(experiments, excerpts)

  const tooHarsh = feedback.filter((f) => f.tags.includes("too_harsh")).length
  const tooGeneric = feedback.filter((f) => f.tags.includes("too_generic")).length

  if (tooHarsh >= 2 && !executionWeaknesses.some((x) => x.includes("tone"))) {
    executionWeaknesses.unshift("memo tone sometimes flagged as sharper than actionable — shorten feedback loops on tests")
    executionWeaknesses.splice(8)
  }
  if (tooGeneric >= 2) {
    gtmMistakes.push("recent memos flagged as templated — bring more hostage-workflow specificity into briefs")
  }

  return {
    computedAt: new Date().toISOString(),
    founderArchetype: archetype,
    riskPosture: riskPosture(counts),
    verdictCounts: counts,
    revalidationCount: revalidationCount(timeline),
    recurringIdeaTags,
    recurringExecutionWeaknesses: executionWeaknesses,
    recurringGtmMistakes: gtmMistakes,
    asymmetryPainBalance: asymmetryBalance(tagTotals),
    operationalRealism: operationalRealismFromExperiments(experiments),
  }
}
