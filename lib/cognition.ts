/**
 * Cognition heuristics — derives the emotional shape of a reflection
 * from the persisted DecisionRecord data.
 *
 * The dashboard speaks a cognition language (emotional state, unresolved
 * tension, conviction trend, contradiction). We don't persist those tags
 * explicitly today — we infer them from verdict + score + age + how often
 * the same idea key has been revisited.
 *
 * Renderers consume the inferred shape. When emotional tags are later
 * persisted directly, swap the inference with a passthrough — components
 * don't need to change.
 */

import type { DecisionRecord } from "@/lib/founder-workflow/types"

export type EmotionalState =
  | "conviction-holding"   // BUILD, recent, score high
  | "still-resolving"      // PIVOT, recent
  | "operational-friction" // PIVOT + low score
  | "needs-revisit"        // any verdict, > 14d old
  | "scarred"              // KILL, recent
  | "fading"               // KILL, older
  | "iterating"            // multiple records on same idea, drifting
  | "contradicting"        // verdict flipped between revisits
  | "unresolved-tension"   // default for PIVOT
  | "asymmetry-emerging"   // BUILD + score in 60-80 range, recent

export type ConvictionTrend = "rising" | "holding" | "softening" | "broken"

export interface CognitionShape {
  state: EmotionalState
  /** Founder-readable label, e.g. "conviction holding" */
  stateLabel: string
  /** Whether this reflection has unresolved tension */
  unresolved: boolean
  /** Conviction trend across revisits of the same idea */
  conviction: ConvictionTrend
  /** True when verdict has flipped on this idea key */
  contradiction: boolean
  /** Days since last cognitive revisit */
  daysSinceRevisit: number
  /** Number of times this idea has been on record */
  revisitCount: number
  /** A single-line cognition pressure note */
  pressure?: string
}

const STATE_LABELS: Record<EmotionalState, string> = {
  "conviction-holding":   "conviction holding",
  "still-resolving":      "still resolving",
  "operational-friction": "operational friction",
  "needs-revisit":        "needs revisit",
  "scarred":              "recently scarred",
  "fading":               "archived — fading",
  "iterating":            "iterating",
  "contradicting":        "contradicting yourself",
  "unresolved-tension":   "unresolved tension",
  "asymmetry-emerging":   "asymmetry emerging",
}

function recordTimeMs(r: DecisionRecord): number {
  const raw = r.timestamp || r.createdAt
  const ms = raw ? Date.parse(raw) : Number.NaN
  return Number.isFinite(ms) ? ms : 0
}

function ideaKey(r: DecisionRecord): string {
  return r.ideaKey || r.ideaId
}

/**
 * Read the cognition shape of a single reflection inside a stream of
 * peers (so we can detect iteration / contradiction across revisits).
 */
export function deriveCognition(record: DecisionRecord, peers: DecisionRecord[]): CognitionShape {
  const ms = recordTimeMs(record)
  const days = ms ? Math.floor((Date.now() - ms) / 86400000) : 9999

  const sameIdea = peers.filter((p) => ideaKey(p) === ideaKey(record))
  const revisitCount = sameIdea.length
  const verdicts = new Set(sameIdea.map((p) => p.verdict))
  const contradiction = verdicts.size > 1

  const score = record.opportunityScore ?? null
  const verdict = record.verdict

  // Conviction trend across revisits — newest first
  const sortedSame = [...sameIdea].sort((a, b) => recordTimeMs(b) - recordTimeMs(a))
  let conviction: ConvictionTrend = "holding"
  if (sortedSame.length >= 2 && score != null && sortedSame[1]?.opportunityScore != null) {
    const delta = score - (sortedSame[1].opportunityScore ?? score)
    if (delta > 8) conviction = "rising"
    else if (delta < -8) conviction = "softening"
    else conviction = "holding"
  }
  if (contradiction) conviction = "broken"

  // Emotional state — order matters; first hit wins
  let state: EmotionalState = "unresolved-tension"

  if (contradiction) {
    state = "contradicting"
  } else if (revisitCount >= 3) {
    state = "iterating"
  } else if (verdict === "KILL" && days <= 14) {
    state = "scarred"
  } else if (verdict === "KILL") {
    state = "fading"
  } else if (verdict === "BUILD" && days <= 5 && (score ?? 0) >= 75) {
    state = "conviction-holding"
  } else if (verdict === "BUILD" && (score ?? 0) >= 60 && (score ?? 0) < 80) {
    state = "asymmetry-emerging"
  } else if (verdict === "PIVOT" && (score ?? 100) < 50) {
    state = "operational-friction"
  } else if (verdict === "PIVOT" && days <= 7) {
    state = "still-resolving"
  } else if (days > 14) {
    state = "needs-revisit"
  } else if (verdict === "PIVOT") {
    state = "unresolved-tension"
  }

  const pressure = pressureFor(state, days, revisitCount)

  return {
    state,
    stateLabel: STATE_LABELS[state],
    unresolved: state !== "conviction-holding" && state !== "fading",
    conviction,
    contradiction,
    daysSinceRevisit: days,
    revisitCount,
    pressure,
  }
}

function pressureFor(state: EmotionalState, days: number, revisits: number): string | undefined {
  switch (state) {
    case "contradicting":
      return "verdict has flipped — name what changed"
    case "iterating":
      return `${revisits} revisits — diminishing returns?`
    case "scarred":
      return "let it sit before the next read"
    case "needs-revisit":
      return `${days}d since last revisit — has reality moved?`
    case "operational-friction":
      return "the wedge is right; the shape is brittle"
    case "asymmetry-emerging":
      return "edge is sharpening but not proven"
    case "still-resolving":
      return "no need to force a verdict yet"
    case "conviction-holding":
      return "rare — protect the certainty by stress-testing it"
    default:
      return undefined
  }
}

/**
 * Build the Active Tensions panel from a stream of recent reflections.
 *
 * Returns up to four tensions: strongest conviction, biggest unresolved
 * risk, hidden dependency / pattern, and operational friction.
 */
export interface Tension {
  kind: "conviction" | "risk" | "dependency" | "friction"
  label: string
  ideaTitle: string
  detail: string
  ideaId: string
}

export function deriveActiveTensions(records: DecisionRecord[]): Tension[] {
  if (records.length === 0) return []

  const recent = records.slice(0, 18)
  const tensions: Tension[] = []

  // Strongest conviction — newest BUILD with highest score, < 14d old
  const builds = recent.filter(
    (r) => r.verdict === "BUILD" && (r.opportunityScore ?? 0) >= 70 && daysOld(r) <= 14,
  )
  if (builds.length > 0) {
    const top = builds.sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))[0]
    tensions.push({
      kind: "conviction",
      label: "strongest conviction",
      ideaTitle: top.ideaTitle || top.summary || "Untitled brief",
      detail: `${top.opportunityScore}/100 · holding for ${daysOld(top)}d`,
      ideaId: top.ideaId,
    })
  }

  // Biggest unresolved risk — recent PIVOT with lowest score
  const pivots = recent.filter((r) => r.verdict === "PIVOT" && daysOld(r) <= 14)
  if (pivots.length > 0) {
    const worst = pivots.sort((a, b) => (a.opportunityScore ?? 100) - (b.opportunityScore ?? 100))[0]
    tensions.push({
      kind: "risk",
      label: "biggest unresolved risk",
      ideaTitle: worst.ideaTitle || worst.summary || "Untitled brief",
      detail:
        worst.opportunityScore != null
          ? `${worst.opportunityScore}/100 · the shape may be wrong`
          : "the shape may be wrong",
      ideaId: worst.ideaId,
    })
  }

  // Hidden dependency — same ideaKey appears multiple times (founder is iterating)
  const byKey = new Map<string, DecisionRecord[]>()
  for (const r of recent) {
    const k = r.ideaKey || r.ideaId
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k)!.push(r)
  }
  const repeated = Array.from(byKey.entries()).filter(([, list]) => list.length >= 2)
  if (repeated.length > 0) {
    const [, list] = repeated.sort((a, b) => b[1].length - a[1].length)[0]
    const newest = list.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]
    tensions.push({
      kind: "dependency",
      label: "pattern returning",
      ideaTitle: newest.ideaTitle || newest.summary || "Untitled brief",
      detail: `${list.length} revisits — what keeps pulling you back?`,
      ideaId: newest.ideaId,
    })
  }

  // Operational friction — KILL within last 7 days
  const kills = recent.filter((r) => r.verdict === "KILL" && daysOld(r) <= 7)
  if (kills.length > 0) {
    const k = kills[0]
    tensions.push({
      kind: "friction",
      label: "recent scar",
      ideaTitle: k.ideaTitle || k.summary || "Untitled brief",
      detail: `killed ${daysOld(k)}d ago — has the lesson moved into the next read?`,
      ideaId: k.ideaId,
    })
  }

  return tensions.slice(0, 4)
}

function daysOld(r: DecisionRecord): number {
  const ms = Date.parse(r.timestamp || r.createdAt || "")
  if (!Number.isFinite(ms)) return 9999
  return Math.floor((Date.now() - ms) / 86400000)
}

/**
 * Returns "Where your thinking left off" context line based on the freshest
 * reflection's cognition shape.
 */
export function whereYouLeftOff(records: DecisionRecord[]): string {
  if (records.length === 0) {
    return "No memos yet. Start Validate when you're ready."
  }
  const latest = records[0]
  const shape = deriveCognition(latest, records)
  const days = shape.daysSinceRevisit

  if (shape.state === "conviction-holding") return "Last verdict: BUILD. Re-run after you ship new facts."
  if (shape.state === "contradicting") return "Last verdict disagrees with the previous run on this idea — worth a new brief."
  if (shape.state === "scarred") return "Last verdict: KILL. Note what you learned, then move on or rewrite the wedge."
  if (shape.state === "iterating") return "Several runs on the same idea — tighten what changed between versions."
  if (days > 14) return `${days} days since your last memo. Update the brief if reality moved.`
  if (shape.state === "still-resolving") return "Last verdict: PIVOT. Adjust the brief before another run."
  if (shape.state === "needs-revisit") return "Stale memo — check if the verdict still matches your market."
  if (records.length === 1) return "One memo on file. The next run usually benefits from real tests."
  return `${records.length} memos on file. Open the latest or start a new run.`
}
