import type { IdeaLineage } from "@/lib/founder-memory/types"

export type ValidationEvolutionRow = {
  ideaKey: string
  label: string
  /** Oldest → newest for reading order */
  points: Array<{ at: string; verdict: string; score?: number }>
  scoreDelta: number | null
  verdictShift: string | null
}

/**
 * Score + verdict progression per lineage from stored filings.
 */
export function buildValidationEvolution(lineages: IdeaLineage[]): ValidationEvolutionRow[] {
  const out: ValidationEvolutionRow[] = []

  for (const L of lineages.slice(0, 10)) {
    const chrono = [...L.versions].reverse()
    if (chrono.length === 0) continue

    const points = chrono.map((v) => ({
      at: v.at,
      verdict: v.verdict,
      score: v.opportunityScore,
    }))

    const first = chrono[0]
    const last = chrono[chrono.length - 1]
    let scoreDelta: number | null = null
    if (first?.opportunityScore != null && last?.opportunityScore != null) {
      scoreDelta = last.opportunityScore - first.opportunityScore
    }

    let verdictShift: string | null = null
    if (first && last && first.verdict !== last.verdict) {
      verdictShift = `${first.verdict} → ${last.verdict}`
    }

    out.push({
      ideaKey: L.ideaKey,
      label: L.label,
      points,
      scoreDelta,
      verdictShift,
    })
  }

  return out
}
