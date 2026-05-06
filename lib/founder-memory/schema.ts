import { z } from "zod"

const VerdictZ = z.enum(["BUILD", "PIVOT", "KILL"])

const MemoSnapshotZ = z.object({
  risks: z.array(z.string().max(420)).max(10).optional().default([]),
  assumptions: z.array(z.string().max(520)).max(18).optional().default([]),
  validationGaps: z.array(z.string().max(520)).max(12).optional().default([]),
  topReasons: z.array(z.string().max(520)).max(4).optional().default([]),
  ifFailsBecause: z.string().max(640).optional(),
  ifWorksBecause: z.string().max(640).optional(),
  pivotTitles: z.array(z.string().max(200)).max(10).optional().default([]),
  opportunityScore: z.number().min(0).max(100).optional(),
  verdict: VerdictZ,
  degraded: z.boolean().optional(),
  enginePath: z.string().max(48).optional(),
})

const ReportFeedbackTagZ = z.enum([
  "useful",
  "accurate",
  "actionable",
  "inaccurate",
  "insightful",
  "repetitive",
  "too_harsh",
  "too_generic",
  "harsh_but_fair",
  "changed_thinking",
])

const ExecutionCheckinStatusZ = z.enum([
  "completed",
  "partial",
  "ignored",
  "blocked",
  "disproven",
  "strong_signal",
])

export const PostFounderEventBodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("validation_verdict"),
    ideaId: z.string().min(1).max(128),
    ideaTitle: z.string().min(1).max(220),
    /** Stable lineage key — same brief thread across filings */
    ideaKey: z.string().min(1).max(200).optional(),
    ideaExcerpt: z.string().max(1200).optional(),
    verdict: VerdictZ,
    opportunityScore: z.number().min(0).max(100).optional(),
    summary: z.string().max(800).optional(),
    memoSnapshot: MemoSnapshotZ.optional(),
    at: z.string().optional(),
  }),
  z.object({
    kind: z.literal("experiment"),
    ideaId: z.string().min(1).max(128),
    ideaKey: z.string().min(1).max(200).optional(),
    ideaTitle: z.string().max(220).optional(),
    actionTaken: z.string().min(1).max(2000),
    outcome: z.string().min(1).max(4000),
    learnings: z.string().min(1).max(4000),
    observationTags: z.array(z.string().max(48)).max(24).optional(),
    at: z.string().optional(),
  }),
  z.object({
    kind: z.literal("pivot_note"),
    ideaId: z.string().max(128).optional(),
    body: z.string().min(1).max(8000),
    at: z.string().optional(),
  }),
  z.object({
    kind: z.literal("report_feedback"),
    ideaId: z.string().max(128).optional(),
    verdict: VerdictZ.optional(),
    tags: z.array(ReportFeedbackTagZ).min(1).max(6),
    note: z.string().max(2000).optional(),
    at: z.string().optional(),
  }),
  z.object({
    kind: z.literal("execution_checkin"),
    planId: z.string().min(1).max(128),
    taskId: z.string().min(1).max(64),
    status: ExecutionCheckinStatusZ,
    note: z.string().max(2000).optional(),
    linkedAssumption: z.string().max(520).optional(),
    ideaId: z.string().max(128).optional(),
    ideaKey: z.string().min(1).max(200).optional(),
    at: z.string().optional(),
  }),
  z.object({
    kind: z.literal("founder_reflection"),
    ideaId: z.string().max(128).optional(),
    ideaKey: z.string().max(200).optional(),
    trigger: z.string().min(1).max(64),
    promptId: z.string().min(1).max(64),
    promptLabel: z.string().min(1).max(160),
    note: z.string().min(1).max(4000),
    at: z.string().optional(),
  }),
])

export type PostFounderEventBody = z.infer<typeof PostFounderEventBodySchema>
