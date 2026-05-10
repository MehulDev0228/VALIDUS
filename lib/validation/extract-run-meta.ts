import type { FreeValidationResponse } from "@/lib/schemas/free-validation"

export function extractRunMeta(
  ideaId: string,
  validation_results: unknown,
): {
  ideaTitle: string
  ideaBrief: Record<string, unknown>
  verdict: "BUILD" | "PIVOT" | "KILL" | null
  opportunityScore: number | null
  modelVersion: string | null
} {
  const r = validation_results as Partial<FreeValidationResponse> & Record<string, unknown>
  const fv = r.finalVerdict
  const verdict =
    fv?.decision === "BUILD" || fv?.decision === "PIVOT" || fv?.decision === "KILL" ? fv.decision : null
  const opportunityScore =
    typeof r.opportunityScore === "number"
      ? Math.round(r.opportunityScore)
      : typeof r.score === "number"
        ? Math.round(r.score * 10)
        : null

  const ic = r.ideaContext
  const ideaTitle =
    (ic && typeof ic === "object" && "coreIdea" in ic && typeof (ic as { coreIdea?: string }).coreIdea === "string"
      ? (ic as { coreIdea: string }).coreIdea.slice(0, 220)
      : null) ||
    (typeof r.ideaSummary === "string" ? r.ideaSummary.slice(0, 220) : null) ||
    ideaId.slice(0, 120)

  const ideaBrief: Record<string, unknown> = {
    ideaId,
    ideaContext: ic ?? undefined,
    summary: typeof r.summary === "string" ? r.summary.slice(0, 2000) : undefined,
  }

  const meta = r.metadata as { enginePath?: string } | undefined
  const modelVersion = meta?.enginePath ?? null

  return { ideaTitle, ideaBrief, verdict, opportunityScore, modelVersion }
}

/** Convert run_ + 32 hex or raw uuid string → canonical UUID for Postgres. */
export function parseRunUuid(runIdRaw: string): string | null {
  const s = runIdRaw.trim()
  const stripped = s.startsWith("run_") ? s.slice(4) : s
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(stripped)) {
    return stripped.toLowerCase()
  }
  if (!/^[a-f0-9]{32}$/i.test(stripped)) return null
  const h = stripped.toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

export function formatRunId(uuidStr: string): string {
  const hex = uuidStr.replace(/-/g, "")
  return `run_${hex}`
}
