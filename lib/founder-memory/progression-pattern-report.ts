import type {
  ExperimentEvent,
  IdeaLineage,
  TimelineEvent,
  ValidationVerdictEvent,
  ProgressionPatternLine,
} from "@/lib/founder-memory/types"
import { lineageKeyForVerdict } from "@/lib/founder-memory/lineage"

/**
 * Periodic-style lines from lineage + sequencing — behavior only.
 */
export function buildProgressionPatternReport(
  timeline: TimelineEvent[],
  lineages: IdeaLineage[],
): ProgressionPatternLine[] {
  const lines: ProgressionPatternLine[] = []

  const verdicts = timeline.filter((e): e is ValidationVerdictEvent => e.kind === "validation_verdict")
  const experiments = timeline.filter((e): e is ExperimentEvent => e.kind === "experiment")

  /** Re-files before any experiment logged for same lineage */
  for (const L of lineages) {
    if (L.experiments.length === 0 && L.versions.length >= 2) {
      lines.push({
        id: "refile_before_field",
        text: `${L.label}: ${L.versions.length} filings on-file before any experiment is logged — field signal may be arriving late.`,
        basis: "lineage",
      })
      break
    }
  }

  let pivotHeavy = 0
  for (const v of verdicts) {
    if (v.verdict === "PIVOT") pivotHeavy++
  }
  const ratio = verdicts.length ? pivotHeavy / verdicts.length : 0
  if (verdicts.length >= 4 && ratio >= 0.55 && experiments.length < pivotHeavy * 0.5) {
    lines.push({
      id: "pivot_before_testing",
      text: "Judges leaned PIVOT often while experiment logs stayed thin — you may be iterating the deck before iterating distribution.",
      basis: "timeline",
    })
  }

  const noisy = lineages.filter((L) => L.versions.length >= 3 && L.experiments.length <= 1)
  if (noisy.length >= 1 && noiseUniqueKeys(noisy) >= 1) {
    lines.push({
      id: "multi_refine_sparse_log",
      text: "At least one idea thread moved through several filings with little experiment residue — lineage is drifting faster than receipts.",
      basis: "execution",
    })
  }

  const multiKey = verdicts.reduce((m, v) => {
    const k = lineageKeyForVerdict(v)
    m.set(k, (m.get(k) ?? 0) + 1)
    return m
  }, new Map<string, number>())
  let returns = 0
  for (const n of multiKey.values()) if (n >= 2) returns++
  if (returns >= 3) {
    lines.push({
      id: "portfolio_refilers",
      text: "Several distinct ideas show multiple passes — persistence is visible; tighten which thread earns the next experiment dollar.",
      basis: "timeline",
    })
  }

  return lines.slice(0, 8)
}

function noiseUniqueKeys(ls: IdeaLineage[]): number {
  const s = new Set(ls.map((L) => L.ideaKey))
  return s.size
}
