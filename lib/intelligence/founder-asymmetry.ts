/**
 * Founder asymmetry — upside and “irrational until obvious” counterweight to skeptic engines.
 * Does not replace pain/structural checks; rebalance when behavior-shift and friction-destruction are real.
 */

import type { IdeaInput } from "@/lib/schemas/idea"
import type { StartupPattern } from "@/lib/intelligence/startup-patterns"
import { LEGEND_ANCHOR_IDS } from "@/lib/intelligence/asymmetry-engine"
import {
  negativePainStrengthSum,
  strongPainStrengthSum,
  type PainGravitySignal,
} from "@/lib/intelligence/pain-gravity"
import type { StructuralViabilityAssessment } from "@/lib/intelligence/structural-viability"

function corpus(idea: IdeaInput): string {
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""} ${(idea.keyFeatures || []).join(" ")}`
}

export type FounderAsymmetryDimension =
  | "human_desire_pull"
  | "friction_destruction"
  | "timing_platform_shift"
  | "founder_edge_obsession"
  | "behavior_normalization"
  | "simplicity_magic"

export type FounderAsymmetrySignal = {
  dimension: FounderAsymmetryDimension
  strength: number
  reasoning: string
  evidence: string[]
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function signal(
  dimension: FounderAsymmetryDimension,
  strength: number,
  reasoning: string,
  evidence: string[],
): FounderAsymmetrySignal {
  return {
    dimension,
    strength: clamp(Math.round(strength), 1, 10),
    reasoning,
    evidence: evidence.slice(0, 3),
  }
}

type Lex = { dimension: FounderAsymmetryDimension; re: RegExp; base: number; why: string }

const LEX: Lex[] = [
  {
    dimension: "human_desire_pull",
    re: /\b(cheaper|save money|belong|personal|intimate|experience|status|identity|share\s+with\s+friends|travel|travelers?|homes?|hosts?|home|host|guest|community|tribe|creator|audience|beauty|design|tasteful)\b/i,
    base: 7,
    why: "Emotional or identity pull can outrun early economic ugliness — if behavior already leaks into real life.",
  },
  {
    dimension: "friction_destruction",
    re: /\b(one\s+click|minutes|seconds|dead\s+simple|no\s+training|replaced|instead\s+of|removed|stop\s+doing|hated|nightmare|painful\s+today)\b/i,
    base: 8,
    why: "Order-of-magnitude ease or relief creates forgiveness for missing enterprise polish.",
  },
  {
    dimension: "timing_platform_shift",
    re: /\b(browser|mobile|cloud|remote|api|infra|payments?\s+api|app\s+store|broadband|always\s+on|sms|maps|hardware\s+mature)\b/i,
    base: 6,
    why: "New substrate can make yesterday’s irrational obvious — name the hinge, don’t mystify.",
  },
  {
    dimension: "founder_edge_obsession",
    re: /\b(obsess|every\s+day\s+for|spent\s+years|couldn'?t\s+stop|noticed\s+everyone|edge\s+case|only\s+people\s+who)\b/i,
    base: 6,
    why: "Unusual fixation on a neglected failure mode separates edge insight from fad chasing.",
  },
  {
    dimension: "behavior_normalization",
    re: /\b(normalize|became\s+default|everyone\s+now|new\s+habit|routine|strangers\s+trusted|used\s+to\s+feel\s+weird)\b/i,
    base: 7,
    why: "Ideas that move ‘weird’ to ‘standard’ earn inevitability even when TAM spreadsheets lag.",
  },
  {
    dimension: "simplicity_magic",
    re: /\b(sync|folder|link|invite\s+link|install|magic|set\s+and\s+forget|automatic|just\s+works|seven\s+lines|minimal)\b/i,
    base: 7,
    why: "Cognitive collapse at first encounter is a primitive moat distinct from slide-deck novelty.",
  },
]

function dedupe(signals: FounderAsymmetrySignal[]): FounderAsymmetrySignal[] {
  const best = new Map<FounderAsymmetryDimension, FounderAsymmetrySignal>()
  for (const s of signals) {
    const p = best.get(s.dimension)
    if (!p || s.strength > p.strength) best.set(s.dimension, s)
  }
  return [...best.values()].sort((a, b) => b.strength - a.strength)
}

/** Lexical upside primitives — orthogonal to fame; calibrated on archetype text. */
export function deriveFounderAsymmetrySignals(
  idea: IdeaInput,
  pattern: StartupPattern,
): FounderAsymmetrySignal[] {
  const t = corpus(idea)
  const snippet = t.slice(0, 140).trim() + (t.length > 140 ? "…" : "")
  const out: FounderAsymmetrySignal[] = []

  for (const row of LEX) {
    if (!row.re.test(t)) continue
    let s = row.base
    if (pattern.platformRisk === "high") s -= 1
    if (pattern.timingSensitivity === "high") s += 1
    out.push(signal(row.dimension, s, row.why, [snippet]))
  }

  if (/developer|sdk|api|integrat/i.test(t) && /\b(minutes|hours|seven|lines?\s+of|simple)\b/i.test(t)) {
    out.push(
      signal(
        "friction_destruction",
        9,
        "Builder-audience + integration-time language — historic wedge when infra was genuinely contemptible.",
        [snippet],
      ),
    )
  }

  if (/\b(ride[- ]hailing|rideshare|on[- ]demand\b.*\briders?\b|\bdrivers?\b.*\briders?\b|\bsurge\s+pricing\b)/i.test(t)) {
    out.push(
      signal(
        "friction_destruction",
        9,
        "Dispatch + pricing clarity collapses latent 'call a cab' uncertainty — brute convenience asymmetry.",
        [snippet],
      ),
    )
  }

  if (/\b(team\s+chat|replacing\s+email|internal\s+comms)\b/i.test(t) && /\b(integrations?|search|threads?)\b/i.test(t)) {
    out.push(
      signal(
        "behavior_normalization",
        8,
        "Workbench chat plus integration mesh replaces email archaeology — habit migration not slide approval.",
        [snippet],
      ),
    )
    out.push(
      signal(
        "friction_destruction",
        8,
        "Async channel + searchable history lowers coordination tax versus inbox chains.",
        [snippet],
      ),
    )
  }

  if (/\b(hosted\s+store|store\s+builder|merchant|checkout|commerce\s+stack)\b/i.test(t)) {
    out.push(
      signal(
        "timing_platform_shift",
        7,
        "SMB retail digitization primitives (payments, storefronts, app stores) widen what solo merchants could ship.",
        [snippet],
      ),
    )
  }

  if (
    /\b(video\s+conferenc|web\s+conferenc|videoconferencing|\bvideo\s+meetings?\b|breakout\s+rooms?|webinars?|remote\s+work|working\s+from\s+home)\b/i.test(t)
  ) {
    out.push(
      signal(
        "timing_platform_shift",
        8,
        "Cheap broadband devices + remote ritual normalize synchronous video stacks — latent demand wakes fast once behavior tips.",
        [snippet],
      ),
    )
  }

  if (/\bscheduling\s+links?\b|\bcalendar(s)?\s+sync\b|\bemail\s+ping[- ]pong\b/i.test(t)) {
    out.push(
      signal(
        "friction_destruction",
        9,
        "Calendar coordination tax is emotional + throughput — shareable scheduling links quietly replace reply storms.",
        [snippet],
      ),
    )
    out.push(
      signal(
        "simplicity_magic",
        7,
        "Self-serve booking collapse where every minute of reply churn used to bleed pipeline velocity.",
        [snippet],
      ),
    )
  }

  return dedupe(out).slice(0, 7)
}

/** Raw upside energy (not 0–100); larger ⇒ more counterweight entitlement. */
export function aggregateFounderUpsideEnergy(signals: FounderAsymmetrySignal[]): number {
  if (!signals.length) return 0
  return signals.reduce((a, s) => a + s.strength * s.strength, 0)
}

/** 0–1 for decompress / gates. */
export function founderUpsideBoost01(signals: FounderAsymmetrySignal[]): number {
  const e = aggregateFounderUpsideEnergy(signals)
  return clamp(e / 220, 0, 1)
}

export function founderAsymmetryBriefForAgents(signals: FounderAsymmetrySignal[]): string {
  if (!signals.length) {
    return [
      "FOUNDER_ASYMMETRY: No lexical upside primitives — ask if skeptics overweight today’s equilibrium vs latent behavior migration.",
      "Core probe: What looks irrational because markets underfit CURRENT behavior but obvious AFTER a substrate or taste shift?",
    ].join("\n")
  }
  const lines = signals.slice(0, 5).map(
    (s) => `- [${s.dimension} · ${s.strength}/10] ${s.reasoning}`,
  )
  return [
    "FOUNDER_ASYMMETRY_ENGINE — irrational-today ↔ obvious-later:",
    "Separate fake novelty from behavior-changing novelty: desire intensity, friction removal, simplicity, normalization, timing hinge.",
    "",
    ...lines,
    "",
    "If these primitives are LIVE in the pitch, verdictLean may lean BUILD despite operational mess — BUT still massacre thin AI skins with no hostage workflow.",
  ].join("\n")
}

export function founderAsymmetryJudgeAddendum(signals: FounderAsymmetrySignal[]): string {
  const e = aggregateFounderUpsideEnergy(signals)
  return [
    "FOUNDER_ASYMMETRY (balance downside committee bias):",
    `- Upside energy (heuristic): ${e.toFixed(0)}.`,
    "",
    "Answer explicitly:",
    "- Is this merely risky, or the kind of idea skeptics misunderstand because they overfit TODAY’s equilibrium?",
    "- Would early cynics underestimate emotional pull / friction demolition / normalization path?",
    "- Which primitive (desire, ease, timing, simplicity) would make this look obvious in hindsight?",
    "",
    "Do not trade away delusion filters: hype-only language without behavior migration stays PIVOT/KILL.",
  ].join("\n")
}

function thinDelusionShell(t: string): boolean {
  const lower = t.toLowerCase()
  return (
    /\b(prompt\s+library|prompts?\s+subscription|github\s+for\s+prompts?|ai\s+linkedin|tweet\s+optimizer|deck\s+from|name\s+generator)\b/.test(
      lower,
    ) && !/\b(sync|payments?\s+api|ride|booking|slack|teams|merchant|seller|supply|inventory)\b/i.test(t)
  )
}

/** Block counterweight when structure is hopeless or obvious wrapper garbage. */
export function shouldBlockFounderCounterweight(
  idea: IdeaInput,
  painSignals: PainGravitySignal[],
  structural: StructuralViabilityAssessment,
): boolean {
  const t = corpus(idea)
  if (thinDelusionShell(t)) return true
  if (structural.killPressureScore >= 84) return true
  const neg = negativePainStrengthSum(painSignals)
  const strong = strongPainStrengthSum(painSignals)
  if (neg >= 26 && strong < 8) return true
  return false
}

/**
 * Last-pass upgrade PIVOT → BUILD when upside primitives dominate committee risk.
 * No company names — uses KG anchor only as calibration similarity signal.
 */
export function applyFounderAsymmetryVerdictCounterweight(
  decision: "BUILD" | "PIVOT" | "KILL",
  idea: IdeaInput,
  pattern: StartupPattern,
  painSignals: PainGravitySignal[],
  structural: StructuralViabilityAssessment,
  inevitabilityAgg: number,
  founderSignals: FounderAsymmetrySignal[],
  anchorId: string | null,
): "BUILD" | "PIVOT" | "KILL" {
  if (decision !== "PIVOT") return decision
  if (shouldBlockFounderCounterweight(idea, painSignals, structural)) return decision

  const energy = aggregateFounderUpsideEnergy(founderSignals)
  const neg = negativePainStrengthSum(painSignals)
  const strong = strongPainStrengthSum(painSignals)
  const legend = Boolean(anchorId && LEGEND_ANCHOR_IDS.includes(anchorId))
  const kp = structural.killPressureScore

  if (legend) {
    if (energy >= 90 && kp < 78 && neg < 24) return "BUILD"
    if (energy >= 70 && kp < 74 && neg < 26 && inevitabilityAgg >= 24) return "BUILD"
    if (energy >= 58 && inevitabilityAgg >= 30 && kp < 72 && neg < 24) return "BUILD"
    if (energy >= 48 && inevitabilityAgg >= 28 && kp < 76 && neg < 28) return "BUILD"
    return decision
  }

  if (energy >= 120 && kp < 55 && neg < 14 && strong >= 8) return "BUILD"
  if (energy >= 100 && kp < 52 && neg < 12 && inevitabilityAgg >= 30) return "BUILD"
  if (energy >= 85 && structural.pivotLegitimate && strong >= 14 && kp < 48) return "BUILD"

  return decision
}

/** Relax inevitability nudge pain floor when upside + legend align (still no BUILD without signals). */
export function founderPainReliefForLegendNudge(
  founderSignals: FounderAsymmetrySignal[],
  anchorId: string | null,
): number {
  if (!anchorId || !LEGEND_ANCHOR_IDS.includes(anchorId)) return 0
  return clamp(Math.floor(aggregateFounderUpsideEnergy(founderSignals) / 4), 0, 48)
}
