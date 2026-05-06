import type { MemoProgressionSnapshot, VerdictLean } from "@/lib/founder-memory/types"

function asStrArray(v: unknown, maxLen: number, maxItems: number): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems)
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined
  const t = v.trim().slice(0, max)
  return t || undefined
}

/**
 * Pulls deterministic fields from a free validation payload — safe to persist for diffs.
 */
export function extractMemoProgressionSnapshot(
  validation: Record<string, unknown>,
  verdictFallback: VerdictLean,
): MemoProgressionSnapshot {
  const fv = validation.finalVerdict as Record<string, unknown> | undefined
  const ic = validation.ideaContext as Record<string, unknown> | undefined
  const verdict =
    fv?.decision === "BUILD" || fv?.decision === "PIVOT" || fv?.decision === "KILL"
      ? (fv.decision as VerdictLean)
      : verdictFallback

  const topRisks = asStrArray(fv?.topRisks, 400, 5)
  const whyFail = asStrArray(validation.whyThisIdeaWillLikelyFail, 400, 5)
  const keyRisks = asStrArray(validation.keyRisks, 400, 5)
  const risks = [...new Set([...topRisks, ...whyFail, ...keyRisks])].slice(0, 8)

  const missing = asStrArray(ic?.missingAssumptions, 500, 12)
  const gaps = asStrArray(ic?.validationGaps, 500, 12)
  const assumptions = [...new Set([...missing, ...gaps])].slice(0, 14)

  const topReasons = asStrArray(fv?.topReasons, 500, 3)
  const pivots = Array.isArray(validation.pivots)
    ? (validation.pivots as { title?: string }[])
        .map((p) => str(p?.title, 180))
        .filter((x): x is string => Boolean(x))
        .slice(0, 8)
    : []

  const meta = validation.metadata as Record<string, unknown> | undefined
  const opportunityScore =
    typeof validation.opportunityScore === "number"
      ? Math.max(0, Math.min(100, validation.opportunityScore))
      : undefined

  return {
    risks,
    assumptions,
    validationGaps: gaps.slice(0, 10),
    topReasons,
    ifFailsBecause: str(fv?.ifFailsBecause, 600),
    ifWorksBecause: str(fv?.ifWorksBecause, 600),
    pivotTitles: pivots,
    opportunityScore,
    verdict,
    degraded: meta?.degraded === true,
    enginePath: typeof meta?.enginePath === "string" ? meta.enginePath.slice(0, 48) : undefined,
  }
}
