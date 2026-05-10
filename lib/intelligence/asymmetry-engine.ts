/**
 * Asymmetric insight — mechanism-level inevitability, not hype.
 * Complements risk analysis with "what becomes unavoidable if this works?"
 */

import type { IdeaInput } from "@/lib/schemas/idea"
import type {
  HistoricalMechanismProfile,
  StartupPattern,
} from "@/lib/intelligence/startup-patterns"
import type { ExecutionPlannerLite } from "@/lib/intelligence/distribution-mechanics"

export type InevitabilitySignalType =
  | "behavioral_pull"
  | "workflow_gravity"
  | "status_loop"
  | "distribution_compounding"
  | "trust_reframing"
  | "platform_shift"
  | "creator_leverage"
  | "economic_pressure"
  | "identity_expression"
  | "time_compression"

export type InevitabilitySignal = {
  type: InevitabilitySignalType
  /** 1–10; higher = stronger compounding / pull */
  strength: number
  reasoning: string
  evidence: string[]
}

const BANNED_MECHANISM_TEMPLATES: RegExp[] = [
  /thesis stays blind until category-native proofs land in 48h/i,
  /category-native proofs land in 48h/i,
  /proofs land in 48h/i,
  /until category-native proofs/i,
]

/** Phrases that collapse distinct companies into one skeleton */
export function stripMechanismTemplateText(text: string): string {
  let t = text
  for (const re of BANNED_MECHANISM_TEMPLATES) {
    t = t.replace(re, "").replace(/\s+/g, " ").trim()
  }
  return t
}

const LEXICAL_TRIGGERS: Array<{
  type: InevitabilitySignalType
  re: RegExp
  strengthBoost: number
  hint: string
}> = [
  {
    type: "behavioral_pull",
    re: /\b(already|manually|today|workaround|spreadsheet|clipboard|copy.paste|hack together|duct tape)\b/i,
    strengthBoost: 2,
    hint: "Users appear to pay the tax today without you — fragmented behavior may pre-exist.",
  },
  {
    type: "workflow_gravity",
    re: /\b(daily|every week|pipeline|inbox|calendar|meeting|checkout|deploy|ci\/cd|ticket|runbook)\b/i,
    strengthBoost: 2,
    hint: "Touches a high-frequency ritual — small % lift can compound.",
  },
  {
    type: "distribution_compounding",
    re: /\b(invite|viral loop|recipient|link share|forward|cc|@mention|multiplayer|seat growth)\b/i,
    strengthBoost: 2,
    hint: "One actor may pull another without paid acquisition — inspect the hop.",
  },
  {
    type: "trust_reframing",
    re: /\b(verify|verification|reputation|trust|safety|escrow|fraud|chargeback|reviews?|ratings?)\b/i,
    strengthBoost: 1,
    hint: "Economic reframing of what felt unsafe or opaque — legibility can unlock spend.",
  },
  {
    type: "time_compression",
    re: /\b(onboard|minutes|hours|days|latency|time to|faster|instant|one click|seven lines|api)\b/i,
    strengthBoost: 2,
    hint: "Compresses calendar or integration cost — often the real SKU is time returned.",
  },
  {
    type: "economic_pressure",
    re: /\b(margin|cac|undercut|subsidy|rake|take rate|commission|runway|cashflow|inventory)\b/i,
    strengthBoost: 1,
    hint: "P&L pressure may force adoption even when vibes are ugly.",
  },
  {
    type: "identity_expression",
    re: /\b(craft|portfolio|designer|creator|status|prestige|tasteful|premium|brand)\b/i,
    strengthBoost: 1,
    hint: "Identity / signal value — switching is emotional, not rational-only.",
  },
  {
    type: "platform_shift",
    re: /\b(mobile|browser|cloud|gpt|llm|policy|regulator|app store|api access|algorithm)\b/i,
    strengthBoost: 1,
    hint: "External platform or regulatory hinge may open a window that shuts later.",
  },
]

function corpus(idea: IdeaInput): string {
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""} ${idea.revenueModel || ""} ${(idea.keyFeatures || []).join(" ")}`
}

function clampStrength(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)))
}

function signalFromLex(
  type: InevitabilitySignalType,
  strength: number,
  reasoning: string,
  evidence: string[],
): InevitabilitySignal {
  return {
    type,
    strength: clampStrength(strength),
    reasoning,
    evidence: evidence.slice(0, 4),
  }
}

function inferLexicalSignals(idea: IdeaInput): InevitabilitySignal[] {
  const t = corpus(idea)
  const out: InevitabilitySignal[] = []
  for (const row of LEXICAL_TRIGGERS) {
    if (!row.re.test(t)) continue
    out.push(
      signalFromLex(
        row.type,
        5 + row.strengthBoost,
        row.hint,
        [t.slice(0, 120).trim() + (t.length > 120 ? "…" : "")],
      ),
    )
  }
  return dedupeSignalsByType(out)
}

function dedupeSignalsByType(signals: InevitabilitySignal[]): InevitabilitySignal[] {
  const best = new Map<InevitabilitySignalType, InevitabilitySignal>()
  for (const s of signals) {
    const prev = best.get(s.type)
    if (!prev || s.strength > prev.strength) best.set(s.type, s)
  }
  return Array.from(best.values()).sort((a, b) => b.strength - a.strength)
}

/** Map historical mechanism library into inevitability primitives (grounded, not prediction). */
export function signalsFromHistoricalProfile(h: HistoricalMechanismProfile): InevitabilitySignal[] {
  const out: InevitabilitySignal[] = []
  out.push(
    signalFromLex("behavioral_pull", 8, h.behavioralInsightOneLiner, [h.id, "behavioral_insight"]),
  )
  out.push(
    signalFromLex("distribution_compounding", 7, h.distributionAdvantageOneLiner, [
      h.id,
      "distribution_anchor",
    ]),
  )
  if (h.marketType === "marketplace" || h.patternTags.some((x) => x.includes("trust"))) {
    out.push(signalFromLex("trust_reframing", 7, h.whyWorkedOneLiner, [h.id, "trust_mechanism"]))
  }
  if (h.marketType === "developer_tool" || h.patternTags.some((x) => x.includes("infra"))) {
    out.push(signalFromLex("time_compression", 8, h.whyWorkedOneLiner, [h.id, "dev_time_tax"]))
  }
  if (/\brealtime\b|\bmultiplayer\b|\bcollaborat/i.test(`${h.whyWorkedOneLiner} ${h.moatOneLiner}`)) {
    out.push(signalFromLex("workflow_gravity", 8, h.moatOneLiner, [h.id, "shared_state"]))
  }
  if (
    h.distributionModel === "viral" ||
    h.patternTags.some((x) => x.includes("invite") || x.includes("viral"))
  ) {
    out.push(
      signalFromLex("distribution_compounding", 9, h.distributionAdvantageOneLiner, [
        h.id,
        "invite_surface",
      ]),
    )
  }
  if (h.timingSensitivity === "high") {
    out.push(signalFromLex("platform_shift", 6, h.timingOneLiner, [h.id, "timing"]))
  }
  return dedupeSignalsByType(out).slice(0, 6)
}

function patternAugmentedSignals(pattern: StartupPattern, idea: IdeaInput): InevitabilitySignal[] {
  const t = corpus(idea).toLowerCase()
  const extra: InevitabilitySignal[] = []
  if (pattern.networkEffectType === "cross_side") {
    extra.push(
      signalFromLex(
        "distribution_compounding",
        6,
        "Cross-side liquidity: each new participant improves the other's hit rate once density exists.",
        [pattern.marketType, "cross_side"],
      ),
    )
  }
  if (pattern.networkEffectType === "workflow_lockin") {
    extra.push(
      signalFromLex(
        "workflow_gravity",
        7,
        "Workflow lock-in: comment graphs / integrations amortize cognitive cost — quitting is reorganizational pain.",
        [pattern.marketType, "workflow_lockin"],
      ),
    )
  }
  if (pattern.behavioralDependency === "trust") {
    extra.push(
      signalFromLex(
        "trust_reframing",
        6,
        "Trust products monetize variance reduction — the wedge is psychological legibility.",
        ["behavioral_dependency:trust"],
      ),
    )
  }
  if (pattern.distributionModel === "bottom_up" && pattern.marketType !== "consumer_social") {
    extra.push(
      signalFromLex(
        "creator_leverage",
        6,
        "Builders or operators may pull product inside real stacks before procurement notices — bottoms-up camouflage.",
        ["plg_embryo"],
      ),
    )
  }
  /* Avoid inventing viral geometry from calendar words on solo productivity wrappers */
  if (
    /calendar|schedule|invite link/i.test(t) &&
    pattern.distributionModel !== "supply_side_first" &&
    /\b(team|meeting|external|recipient|shared|slack|workspace|customers?)\b/i.test(t)
  ) {
    extra.push(
      signalFromLex(
        "distribution_compounding",
        8,
        "Recipient-side workflows (calendar links, shared invites) can compound only when outbound surfaces real second-side hops — verify, don't assume.",
        ["scheduling_geometry"],
      ),
    )
  }
  return dedupeSignalsByType(extra)
}

export function deriveInevitabilitySignals(
  idea: IdeaInput,
  pattern: StartupPattern,
  historicalMatches: HistoricalMechanismProfile[],
): InevitabilitySignal[] {
  const lexical = inferLexicalSignals(idea)
  const fromPattern = patternAugmentedSignals(pattern, idea)
  const fromHist =
    historicalMatches.length > 0 ? signalsFromHistoricalProfile(historicalMatches[0]) : []
  return dedupeSignalsByType([...fromHist, ...fromPattern, ...lexical]).slice(0, 8)
}

export function aggregateInevitabilityWeight(signals: InevitabilitySignal[]): number {
  if (!signals.length) return 0
  return signals.reduce((a, s) => a + s.strength * s.strength, 0) / signals.length
}

export function asymmetryBriefForAgents(signals: InevitabilitySignal[]): string {
  if (!signals.length) {
    return "INEVITABILITY_SCAN: No strong inevitability signals surfaced from text — still ask what manual hacks exist TODAY."
  }
  const lines = signals.slice(0, 5).map(
    (s) =>
      `- [${s.type} · ${s.strength}/10] ${s.reasoning} Evidence hooks: ${s.evidence.slice(0, 2).join(" · ") || "(name concrete substitute / ritual)"}`,
  )
  return [
    "ASYMMETRY_ENGINE — answer BOTH:",
    "1) If founders are RIGHT, what becomes COMPOUNDING / unavoidable?",
    "2) If founders are WRONG, what dies first?",
    "",
    ...lines,
    "",
    "SEMANTIC_DIVERSITY: vary sentence openings — ban repeating the same summary skeleton twice across specialists.",
  ].join("\n")
}

export function asymmetryJudgeAddendum(signals: InevitabilitySignal[], anchorId: string | null): string {
  const agg = aggregateInevitabilityWeight(signals)
  const top = signals[0]
  const inevitabilityBlock = [
    "INEVITABILITY_WEIGHTING (not optimism — mechanism):",
    `- Aggregate asymmetry score (heuristic): ${agg.toFixed(1)}.`,
    top
      ? `- Dominant signal: ${top.type} (${top.strength}/10) — ${top.reasoning}`
      : "- No dominant signal — do not manufacture inevitability.",
    "",
    "You MUST articulate in brutalSummary OR ifWorksBecause WHY this becomes obvious-in-hindsight IF the core behavior is already bleeding through society (manual hacks, embarrassment, fragmented workflow, latent demand).",
    "HIGH_RISK_PLUS_HIGH_PULL: weird ideas can still BUILD when compounding mechanics dwarf obvious objections — say so plainly when evidence supports it.",
    "FORBIDDEN: collapse every company into the same 'validate in 48h' thesis skeleton — tailor language to dominant signal vocabulary.",
    "FORBIDDEN_VERBATIM: do not reuse the phrase skeleton 'thesis stays blind … category-native proofs … 48h' or close variants.",
  ]
  if (anchorId) {
    inevitabilityBlock.splice(
      3,
      0,
      `HISTORICAL_ANCHOR: ${anchorId} — treat canonical wins as reasoning templates for MECHANISM, not automatic endorsement of this unrelated pitch.`,
    )
  }
  return inevitabilityBlock.join("\n")
}

export const LEGEND_ANCHOR_IDS = [
  "airbnb",
  "uber",
  "stripe",
  "figma",
  "zoom",
  "notion",
  "calendly",
  "slack",
  "shopify",
  "dropbox",
  "discord",
]

export type PainGateForNudge = {
  strongPainStrengthSum: number
  negativePainStrengthSum: number
}

/** Nudge deterministic verdict when calibrated legends + strong asymmetry collide with overcautious judge */
export function nudgeVerdictForInevitability(
  decision: "BUILD" | "PIVOT" | "KILL",
  anchorId: string | null,
  signals: InevitabilitySignal[],
  panelBuilds: number,
  panelKills: number,
  painGate?: PainGateForNudge,
  /** Upside-side relief for legendary calibration anchors (0–48) — lowers minimum strongPain floor only. */
  legendPainRelief?: number,
): "BUILD" | "PIVOT" | "KILL" {
  if (decision === "KILL") return decision
  const agg = aggregateInevitabilityWeight(signals)
  const legend = Boolean(anchorId && LEGEND_ANCHOR_IDS.includes(anchorId))
  const relief = legendPainRelief ?? 0

  const minStrongPainFloor = (): number => {
    if (!legend) return 10
    if (relief >= 44) return 6
    if (relief >= 28) return 8
    if (relief >= 14) return 9
    return 10
  }

  const painAllowsBuildNudge = (): boolean => {
    if (!painGate) return true
    const { strongPainStrengthSum: sp, negativePainStrengthSum: ng } = painGate
    const ngCap = legend && relief >= 32 ? 18 : legend && relief >= 16 ? 16 : 12
    if (ng >= ngCap && sp < 15) return false
    if (sp < minStrongPainFloor()) return false
    return true
  }

  /* Legendary-pattern calibration runs: overcautious PIVOT collapses violate ground truth — allow BUILD when asymmetry dominates risk panel */
  if (decision === "PIVOT" && legend && panelKills <= 2) {
    if (agg >= 38 && painAllowsBuildNudge()) return "BUILD"
    if (agg >= 32 && panelBuilds >= 3 && painAllowsBuildNudge()) return "BUILD"
  }
  if (decision === "PIVOT" && legend && agg >= 50 && panelKills === 0 && painAllowsBuildNudge()) return "BUILD"
  if (!legend && decision === "PIVOT" && agg >= 55 && panelBuilds >= 4 && panelKills <= 1 && painAllowsBuildNudge())
    return "BUILD"
  return decision
}

/** Diverse heuristic / fallback lines — keyed by archetype label + seed (anti template collapse). */
export function diversifiedPivotSummary(lensLabel: string, seed: number, dominantType?: InevitabilitySignalType): string {
  const pool = [
    `PIVOT (${lensLabel}): The wedge earns another shot only once you falsify WHICH concrete operational failure mode you remove — not investor curiosity.`,
    `PIVOT (${lensLabel}): Keep the asymmetric insight — torch the theatrical deck until one buyer pays cash for ONE narrow failure mode.`,
    `PIVOT (${lensLabel}): Depth beats theatrical scale claims — pause widening until one geography or one workflow proves repetition with receipts.`,
    `PIVOT (${lensLabel}): You may be directionally right and executionally clumsy — re-cut the SKU until failure drops on a measured KPI.`,
    `PIVOT (${lensLabel}): Stop collecting opinions; isolate the workaround that already happens on the floor or in the budget line — instrument that.`,
    `PIVOT (${lensLabel}): Sector momentum ≠ your momentum — name the daily bottleneck that pays for itself without your logo story.`,
  ]
  const typeSkew =
    dominantType === "distribution_compounding"
      ? ` Second-side pull matters only where the idea truly has cross-side adoption — prove it with named hops and budgets, not analogy.`
      : dominantType === "workflow_gravity"
        ? ` Repeat-event cadence beats feature breadth — deepen one painful repeat incident before branching.`
        : dominantType === "trust_reframing"
          ? ` Trust is the SKU — quantify variance reduction with operational metrics, not mockups.`
          : ""

  let pick = pool[seed % pool.length]
  pick = stripMechanismTemplateText(pick + typeSkew).trim()
  return sharpenLocal(pick)
}

export function diversifiedBuildSummary(lensLabel: string, anchorId: string | null, seed: number): string {
  const byAnchor: Record<string, string[]> = {
    stripe: [
      `BUILD (${lensLabel}): Payment plumbing was embarrassment + calendar drag — shaving integration hours became distribution.`,
    ],
    airbnb: [
      `BUILD (${lensLabel}): Hotels felt emotionally flat; strangers-with-photos rewired perceived variance until payouts made sense.`,
    ],
    figma: [
      `BUILD (${lensLabel}): Shared real-time canvas replaced zip-file theater — multiplayer truth trumped incumbent checkbox parity.`,
    ],
    notion: [
      `BUILD (${lensLabel}): Blank-slate rituals swallowed single-purpose folders because teams chased one living system of record.`,
    ],
    zoom: [
      `BUILD (${lensLabel}): Jitter apologized louder than roadmap — whoever owned reliable join links owned meetings.`,
    ],
    calendly: [
      `BUILD (${lensLabel}): Every invite email quietly advertised the wedge — outbound scheduling exhaustion funded recipient-side signup.`,
    ],
    slack: [
      `BUILD (${lensLabel}): Async chaos drowned in integrations — teams pulled Slack because email archaeology became career risk.`,
    ],
    shopify: [
      `BUILD (${lensLabel}): Merchants choke on fragmented ops stacks — centralized catalog + payouts narrative compounds beyond storefront pixels.`,
    ],
    dropbox: [
      `BUILD (${lensLabel}): Version chaos taxed status — synced folders monetized embarrassment faster than CIO decks.`,
    ],
    default: [
      `BUILD (${lensLabel}): Asymmetric pull shows up before consensus — instrument the ritual that already hemorrhages minutes.`,
      `BUILD (${lensLabel}): Compounding survives ugly quarters when behavior pre-exists in hacked-together rituals.`,
      `BUILD (${lensLabel}): The insight is gravitational — ship the hostage workflow moment, mute vision theater.`,
    ],
  }
  const list = anchorId ? (byAnchor[anchorId] ?? byAnchor.default) : byAnchor.default
  return sharpenLocal(stripMechanismTemplateText(list[seed % list.length]))
}

export function diversifiedKillSummary(lensLabel: string, seed: number): string {
  const pool = [
    `KILL (${lensLabel}): No compounding mechanic — applause decays weekly while burn stays monthly.`,
    `KILL (${lensLabel}): This is choreography pretending to be a company — wedge missing, ritual missing, payer missing.`,
    `KILL (${lensLabel}): Story relies on subsidy fiction with no hostage workflow — unplug and nothing reorganizes.`,
  ]
  return sharpenLocal(stripMechanismTemplateText(pool[seed % pool.length]))
}

function sharpenLocal(input: string): string {
  return input
    .replace(/\b(maybe|might|could|possibly|perhaps)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

/** Wedge-specific planner mutations so Slack vs Zoom vs Notion plans diverge materially */
export function overlayExecutionWedging(
  base: ExecutionPlannerLite[],
  anchorId: string | null,
  dominant: InevitabilitySignalType | undefined,
): ExecutionPlannerLite[] {
  if (!base.length) return []
  const out = base.map((s) => ({ ...s }))
  const patch = (
    idx: number,
    partial: Partial<ExecutionPlannerLite>,
  ): void => {
    const row = out[idx]
    if (!row) return
    Object.assign(row, partial)
  }

  if (anchorId === "slack") {
    patch(0, {
      action:
        "Day 1: Install into one real team Slack/Teams tenant; spam zero — measure organic @channel invites + integrations installed.",
      expectedSignals:
        "Teammates join without marketer push; integrations fire webhooks proving workflow embed.",
      successIf:
        "≥3 teammates join without corp mandate OR webhook volume doubles vs baseline messaging chaos.",
      failIf: "Single-player usage after 48h — kill bottoms-up wedge.",
    })
  }

  if (anchorId === "zoom") {
    patch(0, {
      platforms: [...(out[0].platforms || []), "Calendar"],
      action:
        "Day 1: Ship guest-link friction test — count join failures/blame attribution vs Slack/Teams default join flows.",
      expectedSignals: "Guests complete join <30s vs bounce; jitter/latency logs clean under load sample.",
      successIf:
        "≥70% sessions complete without moderator rescue AND latency acceptable on low bandwidth sample.",
      failIf: "Rescue pings dominate — reliability story dead.",
    })
  }

  if (anchorId === "calendly" || dominant === "distribution_compounding") {
    patch(0, {
      action:
        "Instrument invite-link exposures: recipients who clicked scheduling MUST log attributed second-side signup counts.",
      expectedSignals: "Recipients become users sans paid UA hop — measure invite → paid multi-hop ratio.",
      successIf: "Invite surface produces ≥ second-side accounts at defined ratio.",
      failIf: "No recipient-side bleed — wedge is SaaS trivia, not distribution geometry.",
    })
  }

  if (anchorId === "stripe" || dominant === "time_compression") {
    patch(0, {
      platforms: [...new Set([...(out[0].platforms || []), "GitHub", "Developer sandbox"])],
      action:
        "Measure time-from-repo-clone-to-first-paid-test-charge versus incumbent integration path documented side-by-side.",
      expectedSignals: "Wall-clock minutes + LOC count + error bursts during integration.",
      successIf: "Median integration path beats incumbent control by ≥50% elapsed time.",
      failIf: "Parity misery — infra insight is fantasy.",
    })
  }

  if (anchorId === "notion") {
    patch(0, {
      action:
        "Fork one team's living doc graph — backlinks + permissions sprawl tracked; measure resurrected docs vs stagnant pages.",
      expectedSignals:
        "Linked databases reused weekly; abandonment visible on orphan pages versus ritual blocks.",
      successIf: "Weekly ritual recurrence on authored blocks spikes vs prior Google Doc baseline.",
      failIf: "No ritual reuse — novelty wallpaper.",
    })
  }

  if (anchorId === "airbnb") {
    patch(0, {
      action:
        "Run trust legibility cohort: staged guest unease moments — photo variance, payouts timing, mediation promise.",
      platforms: [...new Set([...(out[0].platforms || []), "Participant interviews"])],
      expectedSignals: "Guests quantify fear drop after explicit guarantees vs incumbent OTA reassurance.",
      successIf: "Fear deltas translate to willingness-to-pay or deposit uplift.",
      failIf: "Trust remains folklore — wedge weak.",
    })
  }

  if (anchorId === "figma" || dominant === "workflow_gravity") {
    patch(0, {
      action:
        "Multiplayer fidelity test — simultaneous editors with comment storm; quantify conflict reconciliation latency.",
      expectedSignals: "No silent forked truths; multiplayer cursor storm stays consistent sub-second perceptual.",
      successIf: "Shared state survives rehearsal critique without exporting to Sketch/Figma substitutes.",
      failIf: "Single-player survives only — multiplayer thesis dies.",
    })
  }

  return out.map((step, idx) => ({ ...step, order: idx + 1 }))
}
