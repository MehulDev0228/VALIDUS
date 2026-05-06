import type { FreeValidationResponse } from "@/lib/schemas/free-validation"
import type { CalibrationIdea, CalibrationRowResult, QualityDimensions } from "@/lib/calibration/types"

const GENERIC_PATTERNS =
  /\b(growing market|huge opportunity|increasing demand|lots of potential|interesting idea|innovative|leverage synergy|moving fast|thought leader)\b/gi

const HEDGE_PATTERNS =
  /\b(maybe|might|could|possibly|perhaps|somewhat|fairly|rather|it seems|overall|potentially)\b/gi

const STARTUP_REALISM_HINTS =
  /\b(ICP|CAC|LTV|pilot|SOW|MRR|churn|GTM|wedge|retention|PLG|enterprise sales|workflow|integrations|SOC|pricing|budget|buyer)\b/i

/** Pull a single string corpus from the memo for heuristic scoring */
function extractCorpus(resp: FreeValidationResponse): string {
  const chunks: string[] = []
  if (resp.summary) chunks.push(resp.summary)
  if (resp.finalVerdict?.brutalSummary) chunks.push(resp.finalVerdict.brutalSummary)
  if (resp.finalVerdict?.ifWorksBecause) chunks.push(resp.finalVerdict.ifWorksBecause)
  if (resp.finalVerdict?.ifFailsBecause) chunks.push(resp.finalVerdict.ifFailsBecause)
  ;(resp.finalVerdict?.topReasons ?? []).forEach((s) => chunks.push(s))
  ;(resp.topRisks ?? []).forEach((s) => chunks.push(s))
  ;(resp.researchInsights ?? []).forEach((i) => {
    chunks.push(i.finding, i.implication, i.trendObservation || "", i.whyItMatters || "")
  })
  ;(resp.agentInsights ?? []).forEach((a) => {
    ;(a.insights ?? []).forEach((x) => chunks.push(x))
    ;(a.evidence ?? []).forEach((x) => chunks.push(x))
  })
  return chunks.join(" \n ")
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Heuristic specificity: penalize generic AI phrases; reward digits and density */
export function scoreSpecificity(text: string): number {
  const len = Math.max(text.length, 1)
  const genericHits = (text.match(GENERIC_PATTERNS) || []).length
  const digits = (text.match(/\d/g) || []).length
  let score = 72
  score -= genericHits * 12
  score += clamp(digits * 3, 0, 18)
  const words = text.split(/\s+/).filter(Boolean).length
  if (words > 80) score -= 8
  return clamp(score)
}

/** More BUILD/PIVOT/KILL spread across agents ⇒ higher disagreement signal */
export function scoreContradictionQuality(resp: FreeValidationResponse): number {
  const agents = resp.agentInsights ?? []
  if (agents.length === 0) return 35
  const counts = new Map<string, number>()
  for (const a of agents) {
    const v = a.verdictLean || "PIVOT"
    counts.set(v, (counts.get(v) || 0) + 1)
  }
  const n = counts.size
  if (n >= 3) return 88
  if (n === 2) return 72
  return 48
}

export function scoreMemorability(resp: FreeValidationResponse, text: string): number {
  let s = 55
  const brutal = resp.finalVerdict?.brutalSummary || ""
  if (brutal.length >= 24 && brutal.length <= 220) s += 22
  if (/[.!?]$/.test(brutal.trim())) s += 6
  if (/\b(kill|pivot|build|dead|pay|switch|default)\b/i.test(text)) s += 10
  return clamp(s)
}

export function scoreSharpness(text: string): number {
  const hedges = (text.match(HEDGE_PATTERNS) || []).length
  let s = 78
  s -= hedges * 8
  return clamp(s)
}

export function scoreRealism(text: string): number {
  let s = 52
  const hits = (text.match(STARTUP_REALISM_HINTS) || []).length
  s += hits * 8
  if (/\$\d/.test(text)) s += 6
  return clamp(s)
}

export function scoreAllDimensions(resp: FreeValidationResponse): QualityDimensions {
  const text = extractCorpus(resp)
  return {
    specificity: scoreSpecificity(text),
    contradictionQuality: scoreContradictionQuality(resp),
    memorability: scoreMemorability(resp, text),
    sharpness: scoreSharpness(text),
    realism: scoreRealism(text),
  }
}

export function compositeQuality(d: QualityDimensions): number {
  const w = {
    specificity: 0.28,
    contradiction: 0.18,
    memorability: 0.14,
    sharpness: 0.22,
    realism: 0.18,
  }
  return clamp(
    d.specificity * w.specificity +
      d.contradictionQuality * w.contradiction +
      d.memorability * w.memorability +
      d.sharpness * w.sharpness +
      d.realism * w.realism,
  )
}

function agentSpread(resp: FreeValidationResponse): Record<string, number> {
  const out: Record<string, number> = {}
  for (const a of resp.agentInsights ?? []) {
    const v = a.verdictLean || "PIVOT"
    out[v] = (out[v] || 0) + 1
  }
  return out
}

export function evaluateCalibrationRow(
  idea: CalibrationIdea,
  resp: FreeValidationResponse,
): CalibrationRowResult {
  const dimensions = scoreAllDimensions(resp)
  const composite = compositeQuality(dimensions)
  const verdict = resp.finalVerdict?.decision ?? "PIVOT"
  return {
    ideaId: idea.id,
    ideaName: idea.name,
    category: idea.category,
    calibrationOutcome: idea.outcome,
    enginePath: resp.metadata.enginePath,
    degraded: resp.metadata.degraded ?? false,
    degradedReason: resp.metadata.degradedReason ?? null,
    verdict,
    opportunityScore:
      typeof resp.opportunityScore === "number" ? resp.opportunityScore : Math.round(resp.score * 10),
    summary: resp.summary,
    topReasons: resp.finalVerdict?.topReasons ?? [],
    topRisks: resp.finalVerdict?.topRisks ?? resp.topRisks ?? [],
    agentVerdictSpread: agentSpread(resp),
    dimensions,
    composite,
    rawSnapshot: {
      finalVerdict: resp.finalVerdict,
      agentInsights: resp.agentInsights,
      researchInsights: resp.researchInsights,
      whyThisIdeaWillLikelyFail: resp.whyThisIdeaWillLikelyFail,
      executionPlanner48h: resp.executionPlanner48h,
      metadata: resp.metadata,
    },
  }
}

export function summarizeRun(rows: CalibrationRowResult[]): {
  count: number
  avgComposite: number
  avgByDimension: QualityDimensions
  degradedCount: number
  geminiCount: number
} {
  const n = rows.length || 1
  const degradedCount = rows.filter((r) => r.degraded).length
  const geminiCount = rows.filter((r) => r.enginePath === "gemini_pipeline").length
  const avgComposite = rows.reduce((a, r) => a + r.composite, 0) / n
  const dims: QualityDimensions = {
    specificity: rows.reduce((a, r) => a + r.dimensions.specificity, 0) / n,
    contradictionQuality: rows.reduce((a, r) => a + r.dimensions.contradictionQuality, 0) / n,
    memorability: rows.reduce((a, r) => a + r.dimensions.memorability, 0) / n,
    sharpness: rows.reduce((a, r) => a + r.dimensions.sharpness, 0) / n,
    realism: rows.reduce((a, r) => a + r.dimensions.realism, 0) / n,
  }
  return { count: rows.length, avgComposite, avgByDimension: dims, degradedCount, geminiCount }
}
