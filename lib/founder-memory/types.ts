import type { FounderOnboardingAnswers } from "@/lib/founder-memory/onboarding-schema"

/** Founder Memory Layer — longitudinal signals from behavior + logs (no fabricated psychology). */

export type VerdictLean = "BUILD" | "PIVOT" | "KILL"

export type FounderArchetype =
  | "product_heavy"
  | "gtm_heavy"
  | "ai_adjacent"
  | "marketplace_leaning"
  | "infra_workflow"
  | "unclear"

export type RiskPostureLabel = "risk_on" | "balanced" | "risk_off"

export type AsymmetryPainBalance = "tilt_asymmetry" | "tilt_pain" | "balanced" | "unknown"

export type RealismTier = "high" | "medium" | "low"

/** Single chronological spine — verdicts, experiments, notes, feedback. */
export type TimelineKind =
  | "validation_verdict"
  | "experiment"
  | "pivot_note"
  | "report_feedback"
  | "execution_plan"
  | "execution_checkin"
  | "founder_reflection"

export type ExecutionTaskAnchor = "risk" | "assumption" | "gap" | "failure_mode" | "wedge"

export type ExecutionTaskItem = {
  taskId: string
  text: string
  anchor: ExecutionTaskAnchor
  anchorQuote?: string
}

export type ExecutionCheckinStatus =
  | "completed"
  | "partial"
  | "ignored"
  | "blocked"
  | "disproven"
  | "strong_signal"

export type TimelineBase = {
  id: string
  at: string
}

/** Compact memo capture for re-validation diffing — no raw LLM blobs. */
export type MemoProgressionSnapshot = {
  risks: string[]
  assumptions: string[]
  validationGaps: string[]
  topReasons: string[]
  ifFailsBecause?: string
  ifWorksBecause?: string
  pivotTitles: string[]
  opportunityScore?: number
  verdict: VerdictLean
  degraded?: boolean
  enginePath?: string
}

export type ValidationVerdictEvent = TimelineBase & {
  kind: "validation_verdict"
  ideaId: string
  /** Stable key across re-files (title + brief hash) — see ideaKeyFromIdea */
  ideaKey?: string
  ideaTitle: string
  /** Truncated description / brief — fuels pattern inference only */
  ideaExcerpt: string
  verdict: VerdictLean
  opportunityScore?: number
  summary?: string
  /** Captured at filing time for “what changed” */
  memoSnapshot?: MemoProgressionSnapshot
}

export type ExperimentEvent = TimelineBase & {
  kind: "experiment"
  ideaId: string
  /** When re-filing creates a new ideaId, carry the same key as verdicts for lineage */
  ideaKey?: string
  ideaTitle?: string
  actionTaken: string
  outcome: string
  learnings: string
  /** Optional structured tags inferred client-side or left empty */
  observationTags?: string[]
}

export type PivotNoteEvent = TimelineBase & {
  kind: "pivot_note"
  ideaId?: string
  body: string
}

export type ReportFeedbackTag =
  | "useful"
  | "accurate"
  | "actionable"
  | "inaccurate"
  | "insightful"
  | "repetitive"
  | "too_harsh"
  | "too_generic"
  | "harsh_but_fair"
  | "changed_thinking"

export type ReportFeedbackEvent = TimelineBase & {
  kind: "report_feedback"
  ideaId?: string
  verdict?: VerdictLean
  tags: ReportFeedbackTag[]
  note?: string
}

export type ExecutionPlanEvent = TimelineBase & {
  kind: "execution_plan"
  ideaId: string
  ideaKey?: string
  sourceVerdictEventId: string
  sourceVerdictAt: string
  tasks: ExecutionTaskItem[]
}

export type ExecutionCheckinEvent = TimelineBase & {
  kind: "execution_checkin"
  ideaId?: string
  ideaKey?: string
  planId: string
  taskId: string
  status: ExecutionCheckinStatus
  note: string
  linkedAssumption?: string
}

export type FounderReflectionEvent = TimelineBase & {
  kind: "founder_reflection"
  ideaId?: string
  ideaKey?: string
  /** e.g. post_memo_read · post_experiment */
  trigger: string
  promptId: string
  promptLabel: string
  note: string
}

export type TimelineEvent =
  | ValidationVerdictEvent
  | ExperimentEvent
  | PivotNoteEvent
  | ReportFeedbackEvent
  | ExecutionPlanEvent
  | ExecutionCheckinEvent
  | FounderReflectionEvent

export type FounderProfileSnapshot = {
  computedAt: string
  founderArchetype: FounderArchetype
  riskPosture: RiskPostureLabel
  verdictCounts: Record<VerdictLean, number>
  revalidationCount: number
  /** Short noun phrases from copy + behaviors */
  recurringIdeaTags: string[]
  recurringExecutionWeaknesses: string[]
  recurringGtmMistakes: string[]
  asymmetryPainBalance: AsymmetryPainBalance
  operationalRealism: RealismTier
}

export type BlindSpotObservation = {
  id: string
  text: string
  basis: "pattern_repeat" | "experiment_outcome" | "feedback_signal"
  confidence: "low" | "medium"
}

/** One idea thread across re-validations */
export type IdeaLineageVersion = {
  eventId: string
  at: string
  ideaId: string
  ideaTitle: string
  verdict: VerdictLean
  opportunityScore?: number
  excerpt: string
  memoSnapshot?: MemoProgressionSnapshot
}

export type IdeaLineage = {
  ideaKey: string
  label: string
  versions: IdeaLineageVersion[]
  experiments: ExperimentEvent[]
}

export type WhatChangedDigest = {
  ideaKey: string
  label: string
  olderAt: string
  newerAt: string
  verdictShift: string
  scoreDelta: string | null
  improved: string[]
  worsened: string[]
  stillOpen: string[]
  assumptionShifts: string[]
}

export type AssumptionStatus = "validated" | "disproven" | "unresolved"

export type AssumptionStatusRow = {
  text: string
  status: AssumptionStatus
  evidence: string
}

export type ProgressionPatternLine = {
  id: string
  text: string
  basis: "lineage" | "timeline" | "execution"
}

/** Lightweight framing — not personalization theatre */
export type FounderOnboardingProfile = FounderOnboardingAnswers & {
  filledAt: string
  /** Present when founder deferred full intake — still blocks redirect loops */
  skipped?: boolean
}

export type FounderOnboardingInput = FounderOnboardingAnswers & {
  skipped?: boolean
}

/** Lightweight counters — complements timeline-derived signals */
export type FounderTrustSignalsV1 = {
  /** Incremented when a memo results surface is viewed (client, debounced) */
  resultsViewsTotal: number
  /** Incremented once per dashboard home session */
  dashboardSessionsTotal: number
  lastResultsViewAt?: string
  lastDashboardOpenAt?: string
  updatedAt: string
}

/** On-disk snapshot */
export type FounderMemoryStoreV1 = {
  version: 1
  ownerId: string
  timeline: TimelineEvent[]
  updatedAt: string
  onboarding?: FounderOnboardingProfile
  trustSignals?: FounderTrustSignalsV1
}
