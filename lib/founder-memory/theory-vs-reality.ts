import type {
  ExecutionCheckinEvent,
  ExperimentEvent,
  IdeaLineage,
  MemoProgressionSnapshot,
} from "@/lib/founder-memory/types"

export type TheoryVsRealityRow = {
  id: string
  ideaKey: string
  label: string
  assumption: string
  predictedPressure?: string
  reality: string
  basis: string
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3),
  )
}

function tokenOverlap(a: string, b: string): number {
  const A = tokens(a),
    B = tokens(b)
  let n = 0
  for (const t of A) if (B.has(t)) n++
  return n
}

function clip(s: string, n: number): string {
  const t = s.trim()
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`
}

function pickRiskPressure(snap: MemoProgressionSnapshot): string | undefined {
  const r = snap.risks[0]
  return r ? clip(r, 220) : undefined
}

/**
 * Map memo assumptions to field outcomes (experiments + execution check-ins) using transparent overlap heuristics.
 */
export function buildTheoryVsRealityRows(
  lineages: IdeaLineage[],
  checkins: ExecutionCheckinEvent[],
): TheoryVsRealityRow[] {
  const rows: TheoryVsRealityRow[] = []
  let rid = 0

  for (const L of lineages.slice(0, 8)) {
    const latest = L.versions[0]
    if (!latest?.memoSnapshot) continue
    const snap = latest.memoSnapshot
    const predicted = pickRiskPressure(snap)
    const filingAt = Date.parse(latest.at)
    const experimentsAfter = L.experiments.filter((e) => Date.parse(e.at) >= filingAt)

    const relevantCheckins = checkins.filter(
      (c) => c.ideaKey === L.ideaKey || (c.ideaId && L.versions.some((v) => v.ideaId === c.ideaId)),
    )

    const assumptions = [...new Set(snap.assumptions.filter(Boolean))].slice(0, 6)
    for (const assumption of assumptions) {
      let bestEx: ExperimentEvent | null = null
      let bestScore = 0
      for (const ex of experimentsAfter) {
        const blob = `${ex.actionTaken}\n${ex.outcome}\n${ex.learnings}`
        const score = tokenOverlap(assumption, blob)
        if (score > bestScore) {
          bestScore = score
          bestEx = ex
        }
      }

      let checkinNote = ""
      for (const c of relevantCheckins) {
        if (!c.linkedAssumption) continue
        if (tokenOverlap(assumption, c.linkedAssumption) >= 2 || assumption.includes(c.linkedAssumption.slice(0, 24))) {
          checkinNote = [c.status, c.note].filter(Boolean).join(" · ")
        }
      }

      let reality = ""
      let basis = ""
      if (bestEx && bestScore >= 2) {
        reality = clip(`${bestEx.outcome} — ${bestEx.learnings}`, 360)
        basis = `Experiment overlap · ${bestEx.actionTaken.slice(0, 80)}`
      } else if (checkinNote) {
        reality = clip(checkinNote, 360)
        basis = "Execution check-in (linked assumption)"
      } else {
        continue
      }

      rid += 1
      rows.push({
        id: `tvr_${L.ideaKey.slice(0, 24)}_${rid}`,
        ideaKey: L.ideaKey,
        label: L.label,
        assumption: clip(assumption, 320),
        predictedPressure: predicted,
        reality,
        basis,
      })
    }
  }

  return rows.slice(0, 18)
}
