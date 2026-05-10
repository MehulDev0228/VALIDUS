import type { VerdictLean } from "@/lib/founder-memory/types"

export type InsightConfidence = "high" | "medium" | "low"

export type WhyVerdictLine = {
  id: string
  headline: string
  body: string
  confidence: InsightConfidence
  /** One-line framing for intellectual honesty — not certainty theater */
  confidenceLabel: string
}

const MARKETPLACE = /\b(marketplace|two-?sided|liquidity|supply|demand|riders|hosts|density)\b/i
const OPS = /\b(workflow|ops|spreadsheet|export|manual|zendesk|ticket|inventory|slack|integrations?)\b/i
const WANT = /\b(excited|beautiful|dream|culture|movement|novel|moonshot|hope|want to)\b/i

type AgentLike = {
  verdictLean?: string
  stance?: string
}

function mk(
  id: string,
  headline: string,
  body: string,
  confidence: InsightConfidence,
  confidenceLabel: string,
): WhyVerdictLine {
  return { id, headline, body, confidence, confidenceLabel }
}

/**
 * Transparent “why” lines from shipped memo fields — deterministic + confidence-labelled.
 */
export function buildWhyVerdictLines(free: Record<string, unknown>, verdict: VerdictLean): WhyVerdictLine[] {
  const lines: WhyVerdictLine[] = []
  const ic = free.ideaContext as Record<string, unknown> | undefined
  const fv = free.finalVerdict as Record<string, unknown> | undefined
  const sb = free.scoreBreakdown as
    | {
        driversDown?: string[]
        driversUp?: string[]
      }
    | undefined

  const ideaBlob = [
    ic?.problem,
    ic?.coreIdea,
    ic?.targetUser,
    free.idea_title,
    free.summary,
  ]
    .filter((x): x is string => typeof x === "string")
    .join(" ")
    .toLowerCase()

  const gaps = Array.isArray(ic?.validationGaps) ? (ic!.validationGaps as string[]) : []
  const missing = Array.isArray(ic?.missingAssumptions) ? (ic!.missingAssumptions as string[]) : []
  const gapLoad = gaps.length + missing.length

  const topRisks = [
    ...((Array.isArray(fv?.topRisks) ? fv?.topRisks : []) as string[]),
    ...((Array.isArray(free.whyThisIdeaWillLikelyFail) ? free.whyThisIdeaWillLikelyFail : []) as string[]),
    ...((Array.isArray(free.topRisks) ? free.topRisks : []) as string[]),
  ].filter(Boolean)

  if (topRisks[0]) {
    lines.push(
      mk(
        "pressure",
        "Primary pressure on the verdict",
        topRisks[0]!.slice(0, 360) + (topRisks[0]!.length > 360 ? "…" : ""),
        "high",
        "High — pulled from your memo’s surfaced failure modes verbatim.",
      ),
    )
  }

  const driversDown = sb?.driversDown?.filter((s): s is string => typeof s === "string").slice(0, 3) ?? []
  if (driversDown.length > 0) {
    lines.push(
      mk(
        "score_drag",
        "Score drivers flagged as weak",
        driversDown.join(" · ").slice(0, 420),
        "high",
        "High — direct decomposition from this run’s weighted score breakdown.",
      ),
    )
  }

  const agents = (Array.isArray(free.agentInsights) ? free.agentInsights : []) as AgentLike[]
  let crit = 0
  let sup = 0
  for (const a of agents) {
    if (a.stance === "critical" || a.verdictLean === "KILL") crit++
    if (a.stance === "supportive" || a.verdictLean === "BUILD") sup++
  }
  if (agents.length >= 3) {
    lines.push(
      mk(
        "bench_split",
        "Agent bench tension",
        crit > sup
          ? "Most specialist agents leaned critical or kill-leaning — the judge weighted that distribution against upside language in your brief."
          : sup > crit
            ? "Several agents found supportive angles — the judge still required execution and necessity proof before BUILD."
            : "Contrasting reads canceled out; this frame leaned on necessity, distribution, and risk tails—not fake consensus.",
        "medium",
        "Medium — stance counts help, but the memo still compresses nuance.",
      ),
    )
  }

  if (gapLoad >= 4) {
    lines.push(
      mk(
        "necessity_gaps",
        "Unclosed validation surface",
        `The decoded brief lists ${gapLoad} combined gaps and missing assumptions — thin receipts there usually cap confidence even when the story is attractive.`,
        "high",
        "High — many named gaps materially lower proof density.",
      ),
    )
  } else if (gapLoad >= 1) {
    lines.push(
      mk(
        "necessity_gaps_light",
        "Assumptions still open",
        "Some dependencies are still named but not evidenced — BUILD would require narrower proof against those seams.",
        "medium",
        "Medium — presence of gaps, but count alone doesn’t doom the wedge.",
      ),
    )
  }

  if (MARKETPLACE.test(ideaBlob)) {
    lines.push(
      mk(
        "marketplace",
        "Marketplace geometry flagged",
        "Two-sided or liquidity-heavy language surfaced — judgments discount optimism unless density and onboarding friction are nailed.",
        "medium",
        "Medium — geometry is suggestive; density still proves it.",
      ),
    )
  }

  if (OPS.test(ideaBlob)) {
    lines.push(
      mk(
        "workflow_anchor",
        "Workflow embedding signal",
        "Operational / systems language appeared — positives count when anchored to hostage workflows Finance or Ops already run.",
        "medium",
        "Medium — language hints workflow pain; audits still beat metaphors.",
      ),
    )
  }

  if (WANT.test(ideaBlob) && !OPS.test(ideaBlob)) {
    lines.push(
      mk(
        "narrative_bias",
        "Narrative energy vs ops proof",
        "Aspirational wording without operational anchors lowered perceived necessity until replaced with workload or budget proof.",
        "low",
        "Low — stylistic heuristic; founders often write aspirationally early.",
      ),
    )
  }

  const oppScore =
    typeof free.opportunityScore === "number" ? Math.round(free.opportunityScore) : Number.NaN
  if (!Number.isNaN(oppScore)) {
    if (verdict === "BUILD" && oppScore < 62) {
      lines.push(
        mk(
          "build_caution",
          "BUILD with moderate score",
          `${oppScore}/100 leaves little margin — the memo assumes you ship falsification receipts soon, not that the idea is obviously right.`,
          "medium",
          "Medium — score + verdict juxtaposition is factual; interpretation stays yours.",
        ),
      )
    }
    if (verdict === "KILL" && oppScore > 52) {
      lines.push(
        mk(
          "kill_context",
          "KILL despite mid score",
          "Structural risks or distribution choke points outweighed the numeric midpoint — revisit wedge or buyer, not polishing.",
          "medium",
          "Medium — structural judgment can outweigh a midpoint score.",
        ),
      )
    }
  }

  const seen = new Set<string>()
  return lines.filter((l) => {
    if (seen.has(l.headline)) return false
    seen.add(l.headline)
    return true
  }).slice(0, 8)
}
