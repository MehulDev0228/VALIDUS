import type { AssumptionStatus, AssumptionStatusRow, IdeaLineage } from "@/lib/founder-memory/types"

const NEG = /\b(wrong|false|didn'?t|no one|nobody|failed|reject|ghost|quiet|never|stopped)\b/i
const POS = /\b(paid|deposit|pilot|signed|yes|repeat|return|referr|converted|intent)\b/i

/**
 * Lightweight states from experiments after the latest filing — deterministic, revisable manually later.
 */
export function buildAssumptionLedgerForLineage(lineage: IdeaLineage): AssumptionStatusRow[] {
  if (!lineage.versions.length) return []
  const latest = lineage.versions[0]
  const assumptions = [...new Set(latest.memoSnapshot?.assumptions ?? [])].slice(0, 24)
  if (!assumptions.length) return []

  const experimentsConsidered = [...lineage.experiments].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  )

  return assumptions.slice(0, 16).map((text) => {
    let status: AssumptionStatus = "unresolved"
    let evidence = "No experiments yet on this thread — assumptions stay provisional."

    if (experimentsConsidered.length === 0) {
      return { text: text.slice(0, 500), status, evidence }
    }

    const needles = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 4)
    const relevant = experimentsConsidered.filter((e) => {
      const b = `${e.actionTaken} ${e.outcome} ${e.learnings}`.toLowerCase()
      return needles.some((n) => b.includes(n))
    })
    const pool = relevant.length > 0 ? relevant : experimentsConsidered
    const blob = pool.map((e) => `${e.outcome} ${e.learnings}`).join("\n")
    const chunk =
      pool
        .map((e) => `${e.actionTaken.slice(0, 80)} → ${e.outcome.slice(0, 160)}`)
        .slice(0, 3)
        .join("; ") || "See experiment log."

    if (POS.test(blob) && !NEG.test(blob)) {
      status = "validated"
      evidence = `Recorded motion leaned affirmative: ${chunk}`
    } else if (NEG.test(blob)) {
      status = "disproven"
      evidence = `Field notes pushed against the claim: ${chunk}`
    } else {
      evidence = `Mixed / quiet — tighten the next falsification around this line: ${chunk}`
    }

    return { text: text.slice(0, 500), status, evidence: evidence.slice(0, 420) }
  })
}
