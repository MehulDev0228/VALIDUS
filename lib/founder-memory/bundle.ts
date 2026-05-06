import { readFounderStore } from "@/lib/founder-memory/store"
import { deriveFounderProfile } from "@/lib/founder-memory/profile"
import { inferBlindSpots } from "@/lib/founder-memory/blind-spots"
import { buildIdeaLineages } from "@/lib/founder-memory/lineage"
import { collectWhatChangedDigests } from "@/lib/founder-memory/change-detection"
import { buildAssumptionLedgerForLineage } from "@/lib/founder-memory/assumption-ledger"
import { buildProgressionPatternReport } from "@/lib/founder-memory/progression-pattern-report"
import { buildExecutionWorkspacePayload, type ExecutionWorkspacePayload } from "@/lib/founder-memory/execution-workspace"
import { buildJourneySurface } from "@/lib/founder-memory/journey-surface"
import type {
  AssumptionStatusRow,
  FounderOnboardingProfile,
  FounderTrustSignalsV1,
  IdeaLineage,
  TimelineEvent,
  WhatChangedDigest,
  ProgressionPatternLine,
} from "@/lib/founder-memory/types"

export type LineageOverview = {
  ideaKey: string
  label: string
  filingCount: number
  oldestAt: string
  newestAt: string
  latestVerdict: string
  latestScore?: number
  experimentCount: number
  versions: Array<{
    at: string
    verdict: string
    opportunityScore?: number
    ideaIdTail: string
    hasMemoSnapshot: boolean
  }>
  experimentsPreview: Array<{ at: string; actionSnippet: string; outcomeSnippet: string }>
}

export type ProgressionWorkspacePayload = {
  lineages: LineageOverview[]
  whatChanged: WhatChangedDigest[]
  assumptionBoard: Array<{ label: string; ideaKey: string; rows: AssumptionStatusRow[] }>
  progressionPatterns: ProgressionPatternLine[]
}

export type FounderMemoryBundle = {
  timeline: TimelineEvent[]
  timelinePreview: TimelineEvent[]
  profile: ReturnType<typeof deriveFounderProfile>
  blindSpots: ReturnType<typeof inferBlindSpots>
  feedbackSummary: {
    totals: Partial<Record<string, number>>
    feedbackEvents: number
    lastSevenDays: number
  }
  storeMeta: {
    updatedAt: string
    ownerId: string
    events: number
  }
  progression: ProgressionWorkspacePayload
  execution: ExecutionWorkspacePayload
  onboarding: FounderOnboardingProfile | null
  trustSignals: FounderTrustSignalsV1 | null
  journeyLines: string[]
}

function ideaIdTail(id: string): string {
  return id.length <= 12 ? id : `…${id.slice(-10)}`
}

function buildProgressionPayload(timeline: TimelineEvent[], raw: IdeaLineage[]): ProgressionWorkspacePayload {
  const whatChanged = collectWhatChangedDigests(raw)

  const assumptionBoard: ProgressionWorkspacePayload["assumptionBoard"] = []
  for (const L of raw.slice(0, 6)) {
    const rows = buildAssumptionLedgerForLineage(L)
    if (!rows.length) continue
    assumptionBoard.push({
      label: L.label,
      ideaKey: L.ideaKey,
      rows: rows.slice(0, 12),
    })
  }

  const lineages: LineageOverview[] = raw.map((L) => ({
    ideaKey: L.ideaKey,
    label: L.label,
    filingCount: L.versions.length,
    oldestAt: L.versions[L.versions.length - 1]?.at ?? L.versions[0]?.at ?? "",
    newestAt: L.versions[0]?.at ?? "",
    latestVerdict: L.versions[0]?.verdict ?? "—",
    latestScore: L.versions[0]?.opportunityScore,
    experimentCount: L.experiments.length,
    versions: L.versions.slice(0, 8).map((v) => ({
      at: v.at,
      verdict: v.verdict,
      opportunityScore: v.opportunityScore,
      ideaIdTail: ideaIdTail(v.ideaId),
      hasMemoSnapshot: Boolean(v.memoSnapshot),
    })),
    experimentsPreview: L.experiments.slice(0, 6).map((e) => ({
      at: e.at,
      actionSnippet: e.actionTaken.slice(0, 140) + (e.actionTaken.length > 140 ? "…" : ""),
      outcomeSnippet: e.outcome.slice(0, 120) + (e.outcome.length > 120 ? "…" : ""),
    })),
  }))

  return {
    lineages,
    whatChanged,
    assumptionBoard,
    progressionPatterns: buildProgressionPatternReport(timeline, raw),
  }
}

function countUnresolvedAssumptions(progression: ProgressionWorkspacePayload): number {
  let n = 0
  for (const board of progression.assumptionBoard) {
    for (const r of board.rows) if (r.status === "unresolved") n++
  }
  return n
}

/** Shape for dashboards + future adaptive reasoning hooks. */
export async function loadFounderMemoryBundle(userId: string): Promise<FounderMemoryBundle> {
  const store = await readFounderStore(userId)
  const profile = deriveFounderProfile(store.timeline)
  const blindSpots = inferBlindSpots(store.timeline)
  const lineagesRaw = buildIdeaLineages(store.timeline)
  const progression = buildProgressionPayload(store.timeline, lineagesRaw)
  const execution = buildExecutionWorkspacePayload(store.timeline, lineagesRaw)

  const totals: Partial<Record<string, number>> = {}
  const weekAgo = Date.now() - 7 * 86400_000
  let feedbackEvents = 0
  let lastSevenDays = 0
  for (const e of store.timeline) {
    if (e.kind !== "report_feedback") continue
    feedbackEvents++
    if (Date.parse(e.at) >= weekAgo) lastSevenDays++
    for (const t of e.tags) totals[t] = (totals[t] ?? 0) + 1
  }

  const memoFilings = store.timeline.filter((e) => e.kind === "validation_verdict").length
  const experimentEvents = store.timeline.filter((e) => e.kind === "experiment").length
  const unresolvedAssumptionCount = countUnresolvedAssumptions(progression)
  const journeyLines = buildJourneySurface({
    timeline: store.timeline,
    onboarding: store.onboarding ?? null,
    trustSignals: store.trustSignals ?? null,
    memoFilings,
    ideaThreads: progression.lineages.length,
    unresolvedAssumptionCount,
    experimentEvents,
    progressionPatterns: progression.progressionPatterns,
    executionFrictionLine: execution.executionPatterns[0]?.text,
    blindSpotsHeadline: blindSpots[0]?.text,
  })

  return {
    timeline: store.timeline,
    timelinePreview: store.timeline.slice(0, 44),
    profile,
    blindSpots,
    progression,
    execution,
    onboarding: store.onboarding ?? null,
    trustSignals: store.trustSignals ?? null,
    journeyLines,
    feedbackSummary: { totals, feedbackEvents, lastSevenDays },
    storeMeta: {
      updatedAt: store.updatedAt,
      ownerId: store.ownerId,
      events: store.timeline.length,
    },
  }
}
