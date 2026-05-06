import { ideaKeyFromIdea } from "@/lib/founder-workflow/types"
import type {
  ExperimentEvent,
  IdeaLineage,
  IdeaLineageVersion,
  TimelineEvent,
  ValidationVerdictEvent,
} from "@/lib/founder-memory/types"

export function lineageKeyForVerdict(v: ValidationVerdictEvent): string {
  if (v.ideaKey?.trim()) return v.ideaKey.trim()
  return ideaKeyFromIdea({ title: v.ideaTitle, description: v.ideaExcerpt || "" })
}

function toVersion(v: ValidationVerdictEvent): IdeaLineageVersion {
  return {
    eventId: v.id,
    at: v.at,
    ideaId: v.ideaId,
    ideaTitle: v.ideaTitle,
    verdict: v.verdict,
    opportunityScore: v.opportunityScore,
    excerpt: v.ideaExcerpt.slice(0, 280),
    memoSnapshot: v.memoSnapshot,
  }
}

/**
 * Group re-validations by stable idea key; attach experiments that share ideaId or ideaKey.
 */
export function buildIdeaLineages(timeline: TimelineEvent[]): IdeaLineage[] {
  const verdicts = timeline.filter((e): e is ValidationVerdictEvent => e.kind === "validation_verdict")
  const experiments = timeline.filter((e): e is ExperimentEvent => e.kind === "experiment")

  const byKey = new Map<string, ValidationVerdictEvent[]>()
  for (const v of verdicts) {
    const k = lineageKeyForVerdict(v)
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k)!.push(v)
  }

  for (const arr of byKey.values()) {
    arr.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  }

  const out: IdeaLineage[] = []
  for (const [ideaKey, vers] of byKey) {
    const ideaIds = new Set(vers.map((v) => v.ideaId))
    const ex = experiments.filter(
      (e) => ideaIds.has(e.ideaId) || (e.ideaKey && e.ideaKey === ideaKey),
    )
    ex.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

    out.push({
      ideaKey,
      label: vers[0]?.ideaTitle ?? "Untitled thread",
      versions: vers.slice(0, 14).map(toVersion),
      experiments: ex.slice(0, 32),
    })
  }

  out.sort((a, b) => {
    const ta = Date.parse(a.versions[0]?.at ?? "")
    const tb = Date.parse(b.versions[0]?.at ?? "")
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })

  return out
}
