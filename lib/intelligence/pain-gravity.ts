/**
 * Pain gravity — recurring operational necessity vs. narrative excitement.
 * Down-weights "interesting / asymmetric / future-of" when pain is weak, rare, or vanity-driven.
 */

import type { IdeaInput } from "@/lib/schemas/idea"
import type { StartupPattern } from "@/lib/intelligence/startup-patterns"
import type { ExecutionPlannerLite } from "@/lib/intelligence/distribution-mechanics"
import { LEGEND_ANCHOR_IDS } from "@/lib/intelligence/asymmetry-engine"

export type PainGravitySignalType =
  | "high_frequency_pain"
  | "workflow_blocker"
  | "manual_workaround"
  | "revenue_leakage"
  | "compliance_risk"
  | "operational_chaos"
  | "social_status_only"
  | "novelty_behavior"
  | "weak_necessity"
  | "embedded_workflow_lockin"

export type PainRecurrenceBand = "hourly" | "daily" | "weekly" | "monthly" | "rare" | "unknown"

export type PainGravitySignal = {
  type: PainGravitySignalType
  strength: number
  recurrence: PainRecurrenceBand
  reasoning: string
  evidence: string[]
}

export const EXEC_COLLABORATION_FINGERPRINT =
  /\b(screen[\s-]?shar(es?|ing)?|invite\s+teammate|organic\s+invites?|instrument\s+(the\s+)?invite|recipient[- ]side\s+signup)\b/i

function corpus(idea: IdeaInput): string {
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""} ${idea.revenueModel || ""} ${(idea.keyFeatures || []).join(" ")}`
}

function clampStrength(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)))
}

function signal(
  type: PainGravitySignalType,
  strength: number,
  recurrence: PainRecurrenceBand,
  reasoning: string,
  evidence: string[],
): PainGravitySignal {
  return {
    type,
    strength: clampStrength(strength),
    recurrence,
    reasoning,
    evidence: evidence.slice(0, 4),
  }
}

/** Best-effort dominant recurrence from merged idea + signals. */
export function inferDominantRecurrenceBand(idea: IdeaInput, signals: PainGravitySignal[]): PainRecurrenceBand {
  const order: PainRecurrenceBand[] = ["hourly", "daily", "weekly", "monthly", "rare", "unknown"]
  const idx = new Map<PainRecurrenceBand, number>(order.map((b, i) => [b, i]))
  let best: PainRecurrenceBand = recurrenceFromCorpus(corpus(idea))
  let bestRank = idx.get(best) ?? 99
  for (const s of signals) {
    const r = idx.get(s.recurrence) ?? 99
    if (s.strength >= 6 && r < bestRank) {
      best = s.recurrence
      bestRank = r
    }
  }
  return best
}

export function recurrenceFromCorpus(t: string): PainRecurrenceBand {
  const s = t.toLowerCase()
  if (/\b(hourly|every hour|many times\s+a\s+day|multiple\s+times\s+(per\s+|a\s+)?day)\b/.test(s)) return "hourly"
  if (/\b(daily|every\s+day|each\s+day|every\s+night|nightly|per\s+diem)\b/.test(s)) return "daily"
  if (
    /\b(weekly|every\s+week|bi-?weekly|each\s+sprint|stand-?ups?)\b/.test(s) ||
    /\b(monday\s+morning|friday\s+export)\b/.test(s)
  )
    return "weekly"
  if (/\b(monthly\s+report|once\s+a\s+month|every\s+few\s+months|quarterly|annually)\b/.test(s)) return "monthly"
  if (/\b(one-?off|once\s+(a\s+)?year|conference\s+only|tourist\b|launch\s+hype\b)\b/.test(s)) return "rare"
  return "unknown"
}

type LexRow = { type: PainGravitySignalType; re: RegExp; strength: number; reasoning: string }

const POSITIVE_LEX: LexRow[] = [
  {
    type: "manual_workaround",
    re: /\b(spreadsheet|excel\b|\bcsv\b|export\b|duplicate(\s+data)?|copy[\s.-]?paste|duct[\s-]?tape|hack\s+together|macros?|glue\s+code|rube[\s-]?goldberg|workaround\b)\b/i,
    strength: 8,
    reasoning: "Evidence of stitched manual rituals — strong when users already pay workaround tax.",
  },
  {
    type: "high_frequency_pain",
    re: /\b(daily|every\s+morning|each\s+meeting|every\s+call|\binbox(es)?\b|notification(s)?|recurring\b|constant(ly)?|always\s+happening|runs\s+every)\b/i,
    strength: 7,
    reasoning: "Linked to repeatable calendar or inbox rhythms — removal test hurts fast if real.",
  },
  {
    type: "workflow_blocker",
    re: /\b(block(er|ed|ing|s)|can'?t\s+ship|blocked\s+on|waiting\s+on|miss(es|ing)?\s+deadline|cascad(e|ing)\s+failure|stuck\b|sla\b.+breach)\b/i,
    strength: 8,
    reasoning: "Throughput hostage — existential to short-term ops if claim is grounded.",
  },
  {
    type: "revenue_leakage",
    re: /\b(refund(s)?|chargeback|payments?\s+fails?|cards?\s+declin|lost\s+(deal|sale)|shrinks\s+margin|carts?\s+abandon)\b/i,
    strength: 7,
    reasoning: "Tied to money velocity — procrastination bleeds ledger, not vibes.",
  },
  {
    type: "compliance_risk",
    re: /\b(soc\s*2|hipaa|gdpr|pci\b|fine(s)?|regulator\b|audit\b|liable|penalties?)\b/i,
    strength: 7,
    reasoning: "Regulatory downside creates forcing function distinct from novelty.",
  },
  {
    type: "operational_chaos",
    re: /\b(on[\s.-]?call|pagerduty|pager\b|war\s+room|outage\b|severity\s+[12]|fires?\s+weekly|ticket\s+flood)\b/i,
    strength: 7,
    reasoning: "Incident-shaped pain repeats under load — brittle if overstated.",
  },
  {
    type: "embedded_workflow_lockin",
    re: /\b(system\s+of\s+record|source\s+of\s+truth|payroll\b|closes\s+(the\s+)?books|payments?\s+rail|ledger\b|billing\s+runs\s+on)\b/i,
    strength: 8,
    reasoning: "If true, disappearance tomorrow reorganizes departments — necessity not curiosity.",
  },
]

const NEGATIVE_LEX: LexRow[] = [
  {
    type: "weak_necessity",
    re: /\b(nice\s*to\s*have|optional\b|explore\b|experiment\b|could\s+be\s+fun|when\s+I\s+have\s+time|curiosity\b|ideas?\s+marketplace\b|thought\s+leader|deck\s+(only|beautiful))\b/i,
    strength: 7,
    reasoning: "Language smells optional — urgency is speculative until buyers pay workaround tax.",
  },
  {
    type: "novelty_behavior",
    re: /\b(nft\b|collectible\b|avatar\b|metaverse\b|gamif|streaks?\b|dopamine\b|vibes?\s+analytics|aura\b|novelty\b)\b/i,
    strength: 7,
    reasoning: "Habit fueled by fad — recurrence often collapses when novelty decays.",
  },
  {
    type: "social_status_only",
    re: /\b(personal\s+brand|founder\s+ego|clout\b|prestige\b|exclusive\s+club|mastermind\b|ambitious\s+teens|networking\s+for\s+status)\b/i,
    strength: 8,
    reasoning: "Identity / status purchase — replacement resistance is political, not operational.",
  },
]

function dedupeBestByType(signals: PainGravitySignal[]): PainGravitySignal[] {
  const m = new Map<PainGravitySignalType, PainGravitySignal>()
  for (const s of signals) {
    const prev = m.get(s.type)
    if (!prev || s.strength > prev.strength) m.set(s.type, s)
  }
  return Array.from(m.values()).sort((a, b) => b.strength - a.strength)
}

function patternAugmentedPain(pattern: StartupPattern, idea: IdeaInput): PainGravitySignal[] {
  const t = corpus(idea).toLowerCase()
  const out: PainGravitySignal[] = []
  const rec = recurrenceFromCorpus(t)

  if (pattern.networkEffectType === "cross_side" || pattern.marketType === "marketplace") {
    const repeatImplied = /\b(daily|weekly|monthly subscription|subscription|recurring booking|repeat)\b/i.test(t)
    const travelOrMobilityCadence = /\b(travelers?|guests?|bookings?|rides?|trips?|riders?|drivers?|surge|on-?demand|peak\s+demand)\b/i.test(
      t,
    )
    if (!repeatImplied && !travelOrMobilityCadence) {
      out.push(
        signal(
          "weak_necessity",
          5,
          rec === "unknown" ? "monthly" : rec,
          "Marketplace geometry without stated repeat transaction cadence — liquidity often fantasy.",
          [pattern.marketType, "cross_side_repetition_unstated"],
        ),
      )
    }
  }

  if (
    pattern.patternTags?.some((x) => /consumer_social|creator/i.test(x)) ||
    pattern.marketType === "consumer_social"
  ) {
    if (/\b(future\s+of|visionary|web3|token)\b/i.test(t)) {
      out.push(
        signal(
          "novelty_behavior",
          6,
          rec,
          "Consumer-social + visionary token language — verify durable habit vs launch spike.",
          ["consumer_social", "vision_language"],
        ),
      )
    }
  }

  return out
}

export function derivePainGravitySignals(idea: IdeaInput, pattern: StartupPattern): PainGravitySignal[] {
  const t = corpus(idea)
  const rec = recurrenceFromCorpus(t)
  const snippet = t.slice(0, 160).trim() + (t.length > 160 ? "…" : "")
  const out: PainGravitySignal[] = []

  for (const row of POSITIVE_LEX) {
    if (!row.re.test(t)) continue
    out.push(signal(row.type, row.strength, rec, row.reasoning, [snippet]))
  }
  for (const row of NEGATIVE_LEX) {
    if (!row.re.test(t)) continue
    out.push(signal(row.type, row.strength, rec, row.reasoning, [snippet]))
  }
  out.push(...patternAugmentedPain(pattern, idea))
  return dedupeBestByType(out).slice(0, 9)
}

const STRONG: Set<PainGravitySignalType> = new Set([
  "high_frequency_pain",
  "workflow_blocker",
  "manual_workaround",
  "revenue_leakage",
  "compliance_risk",
  "operational_chaos",
  "embedded_workflow_lockin",
])

const NEG_TYPES: Set<PainGravitySignalType> = new Set([
  "weak_necessity",
  "novelty_behavior",
  "social_status_only",
])

/** Higher = more operational necessity (raw mechanics, not calibrated to 100). */
export function aggregatePainGravityWeight(signals: PainGravitySignal[]): number {
  if (!signals.length) return 0
  let pos = 0
  let neg = 0
  let nNeg = 0
  let nPos = 0
  for (const s of signals) {
    if (NEG_TYPES.has(s.type)) {
      neg += s.strength * s.strength
      nNeg++
    } else if (STRONG.has(s.type)) {
      pos += s.strength * s.strength
      nPos++
    }
  }
  const raw = pos / Math.max(1, nPos) - (neg > 0 ? neg / Math.max(1, nNeg) : 0)
  return Math.max(0, Math.round(raw * 10) / 10)
}

export function strongPainStrengthSum(signals: PainGravitySignal[]): number {
  return signals.filter((s) => STRONG.has(s.type)).reduce((a, s) => a + s.strength, 0)
}

export function negativePainStrengthSum(signals: PainGravitySignal[]): number {
  return signals.filter((s) => NEG_TYPES.has(s.type)).reduce((a, s) => a + s.strength, 0)
}

export function painGravityBriefForAgents(idea: IdeaInput, signals: PainGravitySignal[]): string {
  const dom = inferDominantRecurrenceBand(idea, signals)
  if (!signals.length) {
    return [
      "PAIN_GRAVITY_SCAN: Insufficient founder text for pain primitives — FORCE answers:",
      "- How often does the pain fire (hourly/daily/weekly/monthly/rare)?",
      "- What breaks (money, ship date, SLA, compliance) if ignored?",
      "- What manual hacks exist TODAY (screenshots acceptable)?",
      "- Removal test: would users reorganize workflows tomorrow if you vanished?",
      "",
      "Assume weak recurrence until contradicted — especially for AI wrappers, decks, dashboards, novelty social.",
    ].join("\n")
  }
  const lines = signals.slice(0, 6).map((s) => {
    const pole = NEG_TYPES.has(s.type) ? "DELUSION_RISK" : "PAIN_HOOK"
    return `- [${pole} · ${s.type} · ${s.recurrence} · ${s.strength}/10] ${s.reasoning}`
  })
  const strong = strongPainStrengthSum(signals)
  const weak = negativePainStrengthSum(signals)
  return [
    "PAIN_GRAVITY_ENGINE — separate INTERESTING from OPERATIONALLY_NECESSARY:",
    `Recurrence_estimate: ${dom} | strong_pain_index: ${strong} | vanity/novelty_penalty_index: ${weak}`,
    "",
    ...lines,
    "",
    "You MUST quantify recurrence + workaround intensity before verdictLean praises BUILD.",
    "If pain is episodic curiosity (decks, idea bazaars, personal branding AI, vibe analytics), verdictLean biases PIVOT/KILL absent paid workaround proof.",
    "Do not confuse living-workspace metaphors ('system of record') with hostage workflows unless removal test or money loss is explicit.",
  ].join("\n")
}

/** Judge must weigh narrative excitement vs recurrence + necessity. */
export function painGravityJudgeAddendum(idea: IdeaInput, signals: PainGravitySignal[]): string {
  const rec = inferDominantRecurrenceBand(idea, signals)
  const w = aggregatePainGravityWeight(signals)
  const strong = strongPainStrengthSum(signals)
  const neg = negativePainStrengthSum(signals)
  const topBad = signals.find((s) => NEG_TYPES.has(s.type))

  return [
    "PAIN_GRAVITY (override asymmetry optimism when weak):",
    `- Dominant recurrence (heuristic): ${rec}. Aggregate necessity weight: ${w.toFixed(1)}; strongPainStrengthSum=${strong}; negativeSignalSum=${neg}.`,
    topBad ? `- Highest delusion leaning: ${topBad.type} (${topBad.strength}/10) — ${topBad.reasoning}` : "- No explicit novelty/vanity lexical hit — still demand recurrence proof.",
    "",
    "Judge MUST explicitly answer:",
    "1) How often does stated pain recur for the buyer/user?",
    "2) Mild annoyance vs revenue/regulatory/shipping damage if unsolved?",
    "3) What manual hacks / ugly rituals exist TODAY?",
    "4) Replacement resistance — good enough incumbent or politically embedded?",
    "5) Removal test — if product vanished tomorrow is it shrug or crisis?",
    "6) Operational necessity vs intellectual curiosity?",
    "",
    "VERDICT_RULE: BUILD requires strongPainStrengthSum materially > vanity/novelty signals OR airtight paid pilot evidence in IdeaContext.",

    "- If asymmetry_language is eloquent BUT pain recurrence is rare/monthly_unknown AND negatives dominate → default PIVOT (or KILL for pure wrapper theater without wedge).",

    "- Ban rewarding 'beautiful collaboration narrative' unless collaborationGeometry is economically necessary for stated pain.",

    "EXECUTION_ANTIFINGERPRINT:",
    "- For solo / AI-wrapper / episodic workflows: forbid templated invite loops, teammate screen-share theater, and generic instrumentation decks unless IdeaContext cites multi-party jobs.",
    "- Anchor first 48h steps to observed workaround capture, diary studies of frequency, or prepaid pilot — not performative Zoom marathons.",
  ].join("\n")
}

export function collaborationGeometryWarranted(
  pattern: StartupPattern,
  signals: PainGravitySignal[],
  idea?: IdeaInput,
): boolean {
  const textExtra = idea ? corpus(idea) : signals.map((s) => s.evidence.join(" ")).join(" ")
  if (pattern.distributionModel === "viral" || pattern.distributionModel === "creator_led") return true
  if (pattern.networkEffectType === "cross_side") {
    const strong = strongPainStrengthSum(signals)
    return strong >= 14 || signals.some((s) => s.type === "manual_workaround" && s.strength >= 7)
  }
  if (pattern.networkEffectType === "workflow_lockin") {
    return strongPainStrengthSum(signals) >= 10
  }
  if (pattern.distributionModel === "bottom_up") {
    return (
      signals.some((s) => s.type === "high_frequency_pain" && s.strength >= 6) ||
      signals.some((s) => s.type === "embedded_workflow_lockin") ||
      /\b(team|shared|collaborat|multiplayer|workspace)\b/i.test(textExtra)
    )
  }
  return false
}

const REPLACEMENTS_COLLAB_OFF: Array<{
  action: string
  expectedSignals: string
  successIf: string
  failIf: string
  platforms: string[]
}> = [
  {
    action:
      "Shadow 3 users through the real workaround: screen-record tab switches, re-exports, or copy-paste rituals; timestamp cost in minutes per occurrence.",
    expectedSignals:
      "Verbatim quotes naming shame moments; count of manual repetitions in a 5-day diary (not NPS).",
    successIf: "≥3 distinct users show same hack pattern ≥3×/week OR cumulative >90 min/week lost.",
    failIf: "No repeatable ritual — pain is intellectual; kill collaboration pretense.",
    platforms: ["In-person or Loom", "Spreadsheet diary", "Notes"],
  },
  {
    action:
      "Run removal test thought experiment with 5 users: 'If this vanished Monday, what meeting gets cancelled?' — force operational not emotional answers.",
    expectedSignals: "Named workflows blocked vs 'minor annoyance' language.",
    successIf: "≥3 users cite revenue, ship date, or customer-facing failure modes.",
    failIf: "Answers stay aesthetic/identity — necessity unproved.",
    platforms: ["Phone", "Calendly", "Short form"],
  },
  {
    action:
      "Sell a narrow prepaid pilot for ONE failure mode only; reject exploratory 'learn more' calls as signal.",
    expectedSignals: "Card on file, SOW, or LOI language with success metric tied to workaround replacement.",
    successIf: "≥1 paid pilot or equivalent deposit for specific scope.",
    failIf: "Zero dollars after 20 tight conversations — pain is narrated, not budgeted.",
    platforms: ["Email", "Stripe", "Phone"],
  },
]

/** Strip invite/screen-share fingerprints when collaboration is not grounded in pain. */
export function overlayPainAwareExecution(
  steps: ExecutionPlannerLite[],
  idea: IdeaInput,
  signals: PainGravitySignal[],
  pattern: StartupPattern,
  seed: number,
): ExecutionPlannerLite[] {
  if (!steps.length) return []
  const warranted = collaborationGeometryWarranted(pattern, signals, idea)
  if (warranted) return steps.map((s, i) => ({ ...s, order: i + 1 }))

  const t = corpus(idea).toLowerCase()
  const needsLiquidityProbe =
    pattern.networkEffectType === "cross_side" || pattern.marketType === "marketplace"
  const out = steps.map((s, i) => ({ ...s, order: i + 1 }))

  for (let i = 0; i < out.length; i++) {
    const row = out[i]
    const blob = `${row.action} ${row.expectedSignals} ${row.successIf}`.toLowerCase()
    const fingerprint = EXEC_COLLABORATION_FINGERPRINT.test(blob) || /\bzoom\b.*\binsight\b/i.test(blob)

    if (!fingerprint && !needsLiquidityProbe) continue

    const pick = REPLACEMENTS_COLLAB_OFF[(seed + i) % REPLACEMENTS_COLLAB_OFF.length]

    if (needsLiquidityProbe && i === 0) {
      Object.assign(row, {
        action:
          "Liquidity realism: recruit 10 supply OR 10 demand (one side only) into same micro-geo/category; measure repeat bookings intent with deposit prefund — no national fantasy.",
        expectedSignals:
          "Double-sided match attempts per day; verbatim trust fears; leakage attempts to offline pay.",
        successIf:
          "≥30% cohort returns for second interaction OR deposits hit defined threshold.",
        failIf:
          "One-and-done tourists; willingness to circumvent platform payments — wedge is fake.",
        platforms: [...new Set([...(row.platforms || []), "Phone", "Field"])],
      })
      continue
    }

    if (fingerprint) {
      Object.assign(row, {
        action: pick.action,
        expectedSignals: pick.expectedSignals,
        successIf: pick.successIf,
        failIf: pick.failIf,
        platforms: pick.platforms,
      })
    }
  }

  return out.map((step, idx) => ({ ...step, order: idx + 1 }))
}

export type PainGateSnapshot = {
  aggregatePainWeight: number
  strongPainStrengthSum: number
  negativePainStrengthSum: number
}

export function summarizePainGate(signals: PainGravitySignal[]): PainGateSnapshot {
  return {
    aggregatePainWeight: aggregatePainGravityWeight(signals),
    strongPainStrengthSum: strongPainStrengthSum(signals),
    negativePainStrengthSum: negativePainStrengthSum(signals),
  }
}

export type PainGravityVerdictGuardOpts = {
  anchorId?: string | null
  /** From founder asymmetry aggregate (rough upside energy); used only with legend anchors */
  founderUpsideEnergy?: number
}

/** After inevitability nudges — stop BUILD when pain gravity cannot carry the story. */
export function applyPainGravityVerdictGuard(
  decision: "BUILD" | "PIVOT" | "KILL",
  idea: IdeaInput,
  signals: PainGravitySignal[],
  pattern: StartupPattern,
  inevitabilityAggregate: number,
  guardOpts?: PainGravityVerdictGuardOpts,
): "BUILD" | "PIVOT" | "KILL" {
  if (decision === "KILL") return decision

  const strong = strongPainStrengthSum(signals)
  const neg = negativePainStrengthSum(signals)
  const rec = inferDominantRecurrenceBand(idea, signals)
  const rarityPenalty = rec === "rare" || rec === "monthly" || rec === "unknown"
  const t = corpus(idea).toLowerCase()
  const seductiveTooling =
    /\b(deck|slides|pitch|notion|workspace|copilot|gpt|llm|generate|generator|optimizer|linkedin|thread|branding)\b/i.test(
      t,
    )

  const legendUpsideRelax =
    Boolean(guardOpts?.anchorId && LEGEND_ANCHOR_IDS.includes(guardOpts.anchorId)) &&
    (guardOpts?.founderUpsideEnergy ?? 0) >= 48 &&
    inevitabilityAggregate >= 22

  if (decision === "BUILD") {
    if (neg >= 14 && strong < 14) {
      if (!legendUpsideRelax || neg >= 22 || strong < 8) return "PIVOT"
    }
    if (strong < 12 && neg >= 8) {
      if (!legendUpsideRelax || neg >= 20) return "PIVOT"
    }
    // High asymmetry sometimes outruns lexical pain cues — don't committee-strip BUILD solely on this line.
    if (strong < 10 && inevitabilityAggregate >= 38 && !legendUpsideRelax) return "PIVOT"
    if (rarityPenalty && strong < 16 && pattern.networkEffectType === "cross_side") {
      if (!legendUpsideRelax || strong < 11) return "PIVOT"
    }
    if (seductiveTooling && strong < 16 && neg >= 5) {
      if (!legendUpsideRelax || neg >= 14) return "PIVOT"
    }
    if (seductiveTooling && strong < 12 && rarityPenalty) {
      if (!legendUpsideRelax || strong < 8) return "PIVOT"
    }
    return decision
  }

  return decision
}
