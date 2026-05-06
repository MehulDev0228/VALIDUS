/**
 * Structural viability — separates "fix the wedge" (PIVOT) from "market is fake" (KILL).
 * Lightweight rules + pain hooks; no new orchestration.
 */

import type { IdeaInput } from "@/lib/schemas/idea"
import type { StartupPattern } from "@/lib/intelligence/startup-patterns"
import { LEGEND_ANCHOR_IDS } from "@/lib/intelligence/asymmetry-engine"
import {
  negativePainStrengthSum,
  strongPainStrengthSum,
  type PainGravitySignal,
} from "@/lib/intelligence/pain-gravity"

function corpus(idea: IdeaInput): string {
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""}`
}

export type StructuralViabilityAssessment = {
  /** 0–100; higher ⇒ more appropriate to KILL vs endless PIVOT. */
  killPressureScore: number
  /** True when durable pain/behavior exists but GTM or wedge is wrong — PIVOT legitimate. */
  pivotLegitimate: boolean
  rationaleLines: string[]
}

function pushReason(out: StructuralViabilityAssessment, line: string, weight: number): void {
  out.rationaleLines.push(line)
  out.killPressureScore = Math.min(100, out.killPressureScore + weight)
}

/** Text after stripping AI buzzwords — tests “would this still matter without AI hype?” */
function stripAiHypeLayer(t: string): string {
  return t
    .replace(/\b(ai|gpt|llm|openai|anthropic|gemini|copilot|generative|neural|machine learning|ml-first)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function deriveStructuralViability(
  idea: IdeaInput,
  pattern: StartupPattern,
  painSignals: PainGravitySignal[],
): StructuralViabilityAssessment {
  const out: StructuralViabilityAssessment = {
    killPressureScore: 0,
    pivotLegitimate: false,
    rationaleLines: [],
  }

  const t = corpus(idea)
  const lower = t.toLowerCase()
  const strong = strongPainStrengthSum(painSignals)
  const neg = negativePainStrengthSum(painSignals)
  const stripped = stripAiHypeLayer(t)
  const strippedWeak = stripped.length < 42 && /\b(ai|gpt|llm|prompt|generative)\b/i.test(t)

  /* Durable-behavior anchors → pivot can be real */
  const durableCues =
    /\b(payment|payroll|invoice|ledger|tax\b|compliance|security|sla|latency|uptime|inventory|shipping|logistics|ehr|claims?|underwriting)\b/i.test(
      t,
    )

  if (
    strong >= 20 ||
    (strong >= 14 && durableCues) ||
    painSignals.some((s) => s.type === "embedded_workflow_lockin" || s.type === "revenue_leakage")
  ) {
    out.pivotLegitimate = true
    out.killPressureScore = Math.max(0, out.killPressureScore - 18)
    out.rationaleLines.push("Durable ops / money / embedding cues present — mis-execution can still be worth a PIVOT.")
  }

  if (neg >= 14) {
    pushReason(out, "Vanity, novelty, or optional-use language weakens structural permanence.", 12)
  }

  /* Thin asset / non-compounding marketplaces */
  if (
    /\b(prompt|prompts?|system\s+prompt|library\s+of\s+prompt|github\s+for\s+prompt)\b/i.test(t) ||
    /\b(startup\s+ideas?|idea\s+bourse|buy\/sell\s+validated\s+ideas)\b/i.test(lower)
  ) {
    pushReason(out, "Prompt/IP idea bazaars rarely compound — assets leak and models subsume primitives.", 26)
  }

  if (/\bprompt\b/i.test(t) && /\b(subscription\s+library|library\s+of|community\s+upvotes?|clone.to.clipboard)\b/i.test(lower)) {
    pushReason(out, "Prompt catalogs compete with repos, defaults, and model updates — retention and moat usually decay.", 20)
  }

  if (/\b(generator|name\s+generator|linkedin\s+optimizer|tweet\s+optimizer|deck\s+from)\b/i.test(lower)) {
    pushReason(out, "Thin generative wrapper SKUs — near-zero switching cost and fast commoditization.", 18)
  }

  if (
    /\b(vibe|aura|dopamine|streak|nft|metaverse|collectible\s+episode)\b/i.test(t) &&
    !durableCues
  ) {
    pushReason(out, "Hobby / hype behavior — permanence and budget lines are usually thin.", 16)
  }

  if (pattern.networkEffectType === "cross_side" && strong < 14 && !/\b(repeat|subscription|recurring|bookings?)\b/i.test(t)) {
    pushReason(out, "Two-sided story without repeat-demand language — liquidity economics often imaginary.", 14)
  }

  if (strippedWeak) {
    pushReason(out, "AI hype removal test: stripped pitch collapses — proposition may be model theater.", 22)
  }

  /* Platform subsume */
  if (
    /\b(chatgpt|gpt-4|slack\s+bot|chrome\s+extension\s+for)\b/i.test(lower) &&
    strong < 12 &&
    !painSignals.some((s) => s.type === "manual_workaround")
  ) {
    pushReason(out, "Incumbent surfaces can ship the same thin layer; no captive workflow evidence.", 14)
  }

  if (/\b(personal\s+brand|founder\s+dashboard|mastermind|exclusive\s+club)\b/i.test(lower) && strong < 16) {
    pushReason(out, "Identity / ego surface — weak path to operational dependency.", 12)
  }

  /* Penalize contradiction: claims system-of-record but category is toy */
  if (
    /\bsystem\s+of\s+record|source\s+of\s+truth\b/i.test(lower) &&
    (/\b(deck|slides|generator|prompt|optimizer)\b/i.test(lower) || strong < 10)
  ) {
    pushReason(out, "'System of record' metaphor on non-hostage workflows — embedding claim likely fiction.", 15)
  }

  out.killPressureScore = Math.max(0, Math.min(100, Math.round(out.killPressureScore)))

  /* Refine pivot legitimacy */
  if (!out.pivotLegitimate && strong >= 12 && neg <= 8 && out.killPressureScore < 55) {
    out.pivotLegitimate = true
    out.rationaleLines.push("Mixed signals — some workaround or frequency evidence; PIVOT remains on the table.")
  }

  return out
}

export function structuralViabilityJudgeAddendum(a: StructuralViabilityAssessment): string {
  return [
    "STRUCTURAL_VIABILITY (PIVOT vs KILL):",
    `- killPressureScore (heuristic): ${a.killPressureScore}/100`,
    `- pivotLegitimate (real market, wrong wedge/GTM): ${a.pivotLegitimate ? "YES" : "NO"}`,
    "",
    "PIVOT only when: recurring pain/behavior is REAL but wedge, ICP, or GTM is wrong.",
    "KILL when: behavior is weak, recurrence is fantasy, economics cannot compound, AI hype carries the story, or embedding path is implausible — do not extend life with 'narrow the wedge' theater.",
    "",
    "AI_HYPE_REMOVAL_TEST: would this still matter tomorrow if model APIs were boring commodities and free?",
    "",
    ...a.rationaleLines.slice(0, 6).map((line) => `- ${line}`),
  ].join("\n")
}

export function structuralViabilityAgentBrief(a: StructuralViabilityAssessment): string {
  return [
    "STRUCTURAL_VIABILITY_SNAPSHOT:",
    `killPressure≈${a.killPressureScore}; pivotLegitimate=${a.pivotLegitimate}.`,
    "If killPressure is high and pivotLegitimate is NO, verdictLean should favor KILL over polite PIVOT.",
    "Weird is fine — structurally fake demand is not.",
  ].join("\n")
}

/** After pain guards — convert chronic PIVOT-softness into KILL when structure is hopeless. */
export function applyStructuralViabilityVerdict(
  decision: "BUILD" | "PIVOT" | "KILL",
  anchorId: string | null,
  assessment: StructuralViabilityAssessment,
): "BUILD" | "PIVOT" | "KILL" {
  if (decision === "KILL") return decision
  if (anchorId && LEGEND_ANCHOR_IDS.includes(anchorId)) return decision

  if (decision === "PIVOT") {
    if (!assessment.pivotLegitimate && assessment.killPressureScore >= 56) return "KILL"
    if (assessment.killPressureScore >= 70) return "KILL"
    return decision
  }

  /* BUILD + structural mirage → drop to PIVOT first ( sharper than leaving false BUILD ) */
  if (decision === "BUILD" && !assessment.pivotLegitimate && assessment.killPressureScore >= 64) return "PIVOT"
  return decision
}
