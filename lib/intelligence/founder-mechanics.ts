import type { RiskTier, StartupPattern } from "@/lib/intelligence/startup-patterns"

function tierScore(t: RiskTier): number {
  if (t === "high") return 2
  if (t === "medium") return 1
  return 0
}

/** Push judge away from MBA-style 'validate more' — demand asymmetric conviction */
export function deriveFounderVerdictPressure(p: StartupPattern): string {
  const fragility =
    tierScore(p.platformRisk) +
    tierScore(p.timingSensitivity) +
    tierScore(p.operationalComplexity) +
    tierScore(p.monetizationRisk)
  const upsideHint =
    p.networkEffectType === "workflow_lockin" || p.networkEffectType === "cross_side" || p.networkEffectType === "data"

  const lines: string[] = []

  lines.push(
    "CONVICTION_RULES (founder-realism, not consultant hedging): PIVOT is NOT the default verdict. Use PIVOT only when the directional thesis is sound but the wedge, ICP, pricing, or channel spine is wrong yet repairable.",
  )
  lines.push(
    "BUILD when plausible asymmetric upside shows up in the evidence bundle AND a believable distribution/cost path exists without hand-waving — even if risks remain.",
  )
  lines.push(
    "KILL when structural impossibility, lethal platform rent, fraud-like demand, or irreversible trust failure is the core story — say it bluntly instead of soft-pivoting.",
  )
  lines.push(
    "Avoid MBA safety blankets: never output 'interesting but needs validation' as a conclusion — replace with which specific mechanism is unproven and what binary test kills it.",
  )

  if (fragility >= 6) {
    lines.push(
      "FRAGILITY_SIGNALS_HIGH: lean KILL or hard PIVOT unless IdeaContext shows a rare structural cushion (procurement lock, regulatory license, proprietary distribution). Explain the cushion in one sentence or convict the downside.",
    )
  } else if (fragility <= 2 && upsideHint) {
    lines.push(
      "UPSIDE_ASYMMETRY_PRESENT: if specialist disagreements are about execution—not market existence—permit a sharp BUILD with explicit instrumentation obligations.",
    )
  }

  if (p.monetizationRisk === "high" && p.marketType !== "consumer_social") {
    lines.push("Monetization risk high: force explicit budget line + payback story; absence is a KILL vector, not a shrug.")
  }

  return lines.join("\n")
}

export function deriveFounderNarrativeHooks(p: StartupPattern): string[] {
  const hooks: string[] = []
  if (p.patternTags?.length) {
    hooks.push(`Pattern tags to weaponize in reasoning: ${p.patternTags.slice(0, 6).join(", ")}.`)
  }
  hooks.push(
    "Write like operators who survived failures: name the betrayal scenario (customers, regulators, platforms, infra) explicitly.",
  )
  return hooks
}
