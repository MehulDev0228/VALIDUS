/** Plain-text X/Twitter thread from a free-tier memo payload (no API calls). */

function clampLine(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function buildTwitterThreadFromMemo(free: Record<string, unknown>, opts?: { siteUrl?: string }): string {
  const verdict =
    (free.finalVerdict as { decision?: string } | undefined)?.decision ||
    (free.classification === "high" ? "BUILD" : free.classification === "low" ? "KILL" : "PIVOT")
  const score =
    typeof free.opportunityScore === "number"
      ? Math.round(free.opportunityScore)
      : typeof free.score === "number"
        ? Math.round((free.score as number) * 10)
        : null
  const title =
    (typeof free.idea_title === "string" && free.idea_title) ||
    (free.ideaContext as { coreIdea?: string } | undefined)?.coreIdea ||
    "Startup idea"

  const fv = free.finalVerdict as { brutalSummary?: string } | undefined
  const brutal = typeof fv?.brutalSummary === "string" ? fv.brutalSummary.trim() : ""

  const topRisks = [
    ...(((free.finalVerdict as { topRisks?: string[] } | undefined)?.topRisks as string[]) ?? []),
    ...(((free.topRisks as string[]) ?? []).slice(0, 2)),
  ]
    .filter((x): x is string => typeof x === "string" && Boolean(x.trim()))
    .slice(0, 3)

  const planLines = (() => {
    const p = free.executionPlanner48h as Array<{ action?: string; day?: string }> | undefined
    if (Array.isArray(p) && p.length > 0) {
      return p.slice(0, 3).map((row, i) => `${row.day || `Day ${i + 1}`}: ${row.action || ""}`.trim())
    }
    const f = free.fastestWayToProveWrong48h as string[] | undefined
    if (Array.isArray(f)) return f.slice(0, 3)
    return []
  })()

  const base = opts?.siteUrl?.replace(/\/$/, "") || ""

  const parts: string[] = []
  parts.push(`I ran this idea through VERDIKT — ${verdict}${score != null ? ` (${score}/100)` : ""}.`)
  parts.push("")
  parts.push(clampLine(title, 260))
  if (brutal) {
    parts.push("")
    parts.push(clampLine(brutal, 260))
  }

  if (topRisks.length > 0) {
    parts.push("")
    parts.push("Top pressures:")
    for (const r of topRisks) {
      parts.push(`• ${clampLine(r, 220)}`)
    }
  }

  if (planLines.length > 0) {
    parts.push("")
    parts.push("48h falsification moves:")
    for (const line of planLines) {
      parts.push(clampLine(line, 260))
    }
  }

  if (base) {
    parts.push("")
    parts.push(`${base} — file your own brief, get the memo.`)
  }

  return parts.join("\n").trim()
}
