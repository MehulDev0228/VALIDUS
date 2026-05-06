import { buildTheoryVsRealityRows, type TheoryVsRealityRow } from "@/lib/founder-memory/theory-vs-reality"
import { inferExecutionPatterns, type ExecutionPatternLine } from "@/lib/founder-memory/execution-memory"
import { buildValidationEvolution, type ValidationEvolutionRow } from "@/lib/founder-memory/validation-evolution"
import type {
  ExecutionCheckinEvent,
  ExecutionPlanEvent,
  IdeaLineage,
  TimelineEvent,
  ValidationVerdictEvent,
} from "@/lib/founder-memory/types"

export type ExecutionTaskPackView = {
  planId: string
  at: string
  ideaKey?: string
  ideaId: string
  threadLabel: string
  verdictAt: string
  tasks: Array<{
    taskId: string
    text: string
    anchor: string
    checkins: Array<{ at: string; status: string; note: string }>
  }>
}

export type ExecutionRecentSummary = {
  windowDays: number
  checkinTotal: number
  byStatus: Partial<Record<string, number>>
}

export type ExecutionWorkspacePayload = {
  taskPacks: ExecutionTaskPackView[]
  theoryVsReality: TheoryVsRealityRow[]
  validationEvolution: ValidationEvolutionRow[]
  executionPatterns: ExecutionPatternLine[]
  recent: ExecutionRecentSummary
}

const MS_DAY = 86400_000

function verdictLabelForPlan(timeline: TimelineEvent[], sourceVerdictEventId: string): string {
  const v = timeline.find((e): e is ValidationVerdictEvent => {
    return e.kind === "validation_verdict" && e.id === sourceVerdictEventId
  })
  return v?.ideaTitle ?? "Idea thread"
}

/**
 * Compose execution archive slice for workspace + APIs — deterministic, capped.
 */
export function buildExecutionWorkspacePayload(
  timeline: TimelineEvent[],
  lineages: IdeaLineage[],
): ExecutionWorkspacePayload {
  const plans = timeline.filter((e): e is ExecutionPlanEvent => e.kind === "execution_plan").slice(0, 24)
  const checkinsAll = timeline.filter((e): e is ExecutionCheckinEvent => e.kind === "execution_checkin")

  const byPlan = new Map<string, ExecutionCheckinEvent[]>()
  for (const c of checkinsAll) {
    if (!byPlan.has(c.planId)) byPlan.set(c.planId, [])
    byPlan.get(c.planId)!.push(c)
  }
  for (const arr of byPlan.values()) {
    arr.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  }

  const taskPacks: ExecutionTaskPackView[] = []
  for (const p of plans.slice(0, 8)) {
    const cis = byPlan.get(p.id) ?? []
    const taskCheckins = new Map<string, ExecutionCheckinEvent[]>()
    for (const c of cis) {
      if (!taskCheckins.has(c.taskId)) taskCheckins.set(c.taskId, [])
      taskCheckins.get(c.taskId)!.push(c)
    }

    taskPacks.push({
      planId: p.id,
      at: p.at,
      ideaKey: p.ideaKey,
      ideaId: p.ideaId,
      threadLabel: verdictLabelForPlan(timeline, p.sourceVerdictEventId),
      verdictAt: p.sourceVerdictAt,
      tasks: p.tasks.map((t) => ({
        taskId: t.taskId,
        text: t.text,
        anchor: t.anchor,
        checkins:
          taskCheckins.get(t.taskId)?.map((c) => ({
            at: c.at,
            status: c.status,
            note: c.note,
          })) ?? [],
      })),
    })
  }

  const now = Date.now()
  const windowMs = 14 * MS_DAY
  const recentCheckins = checkinsAll.filter((c) => now - Date.parse(c.at) <= windowMs)
  const byStatus: Partial<Record<string, number>> = {}
  for (const c of recentCheckins) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
  }

  return {
    taskPacks,
    theoryVsReality: buildTheoryVsRealityRows(lineages, checkinsAll),
    validationEvolution: buildValidationEvolution(lineages),
    executionPatterns: inferExecutionPatterns(timeline),
    recent: {
      windowDays: 14,
      checkinTotal: recentCheckins.length,
      byStatus,
    },
  }
}
