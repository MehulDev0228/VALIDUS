/** Versioned blobs appended to disk — internal product learning only */

export type ProductIntelEventV1 = {
  v: 1
  at: string
  /** Pseudonymous — salted short hash server-side when session exists */
  subjectKey: string | "anon"
  kind: ProductIntelKind
  ideaId?: string
  ideaKey?: string
  verdict?: string
  sectionId?: string
  dwellMs?: number
  meta?: Record<string, unknown>
}

export type ProductIntelKind =
  | "memo_first_open"
  | "memo_revisit"
  | "section_dwell"
  | "specialist_notes_expand"
  | "specialist_notes_collapse"
  | "reflection_submitted"
  | "experiment_logged"
  | "execution_checkin_product"
  | "workspace_home_open"

export type ProductIntelAggregate = {
  scannedLines: number
  sinceIso: string
  byKind: Record<string, number>
  dwellBySection: Array<{ sectionId: string; totalMs: number; samples: number }>
  revisitCount: number
  memoOpens: number
  topIdeaIds: Array<{ ideaId: string; events: number }>
  reflectionsByPrompt: Record<string, number>
  specialistToggleCount: number
}
