import type { DecisionRecord } from "@/lib/founder-workflow/types"

/** Opens saved memo results (+ sharing toolbar when signed in). Not the new-memo form. */
export function memoResultHref(record: Pick<DecisionRecord, "runId">): string {
  if (record.runId) {
    return `/dashboard/validate/results?run=${encodeURIComponent(record.runId)}`
  }
  return "/dashboard/validate/results"
}
