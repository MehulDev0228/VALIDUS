import type { IdeaLineage, MemoProgressionSnapshot, WhatChangedDigest } from "@/lib/founder-memory/types"

function fingerprint(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 220)
}

function bucketDiff(prev: string[], next: string[]): { gained: string[]; lost: string[]; overlap: string[] } {
  const pm = new Map<string, string>()
  for (const x of prev) pm.set(fingerprint(x), x)
  const nm = new Map<string, string>()
  for (const x of next) nm.set(fingerprint(x), x)
  const lost: string[] = []
  for (const [k, raw] of pm) if (!nm.has(k)) lost.push(raw)
  const gained: string[] = []
  for (const [k, raw] of nm) if (!pm.has(k)) gained.push(raw)
  const overlap: string[] = []
  for (const [k, raw] of pm) if (nm.has(k)) overlap.push(raw)
  return { gained, lost, overlap }
}

function compareSnapshots(
  older: MemoProgressionSnapshot,
  newer: MemoProgressionSnapshot,
): Pick<WhatChangedDigest, "improved" | "worsened" | "stillOpen" | "assumptionShifts"> {
  const r = bucketDiff(older.risks, newer.risks)
  const a = bucketDiff(older.assumptions, newer.assumptions)

  const improved: string[] = []
  for (const x of r.lost) improved.push(`Risk eased on record: ${x.slice(0, 160)}${x.length > 160 ? "…" : ""}`)
  const worsened: string[] = []
  for (const x of r.gained) worsened.push(`New risk surfaced: ${x.slice(0, 160)}${x.length > 160 ? "…" : ""}`)

  const stillOpen: string[] = r.overlap
    .slice(0, 6)
    .map((x) => `Still live: ${x.slice(0, 140)}${x.length > 140 ? "…" : ""}`)

  const assumptionShifts: string[] = []
  for (const x of a.lost) assumptionShifts.push(`Assumption narrowed or retired: ${x.slice(0, 140)}${x.length > 140 ? "…" : ""}`)
  for (const x of a.gained) assumptionShifts.push(`New dependency named: ${x.slice(0, 140)}${x.length > 140 ? "…" : ""}`)

  return {
    improved: improved.slice(0, 8),
    worsened: worsened.slice(0, 8),
    stillOpen: stillOpen.slice(0, 8),
    assumptionShifts: assumptionShifts.slice(0, 8),
  }
}

/** Latest two memo snapshots in the lineage — strategic diff, not analytics. */
export function buildWhatChangedDigest(lineage: IdeaLineage): WhatChangedDigest | null {
  const withSnapshots = lineage.versions.filter((v) => v.memoSnapshot)
  if (withSnapshots.length < 2) return null

  const newer = withSnapshots[0]
  const older = withSnapshots[1]
  const ns = newer.memoSnapshot!
  const os = older.memoSnapshot!
  const sub = compareSnapshots(os, ns)

  const scoreDelta =
    ns.opportunityScore != null && os.opportunityScore != null
      ? `${ns.opportunityScore - os.opportunityScore >= 0 ? "+" : ""}${ns.opportunityScore - os.opportunityScore} pts`
      : null

  return {
    ideaKey: lineage.ideaKey,
    label: lineage.label,
    olderAt: older.at,
    newerAt: newer.at,
    verdictShift: `${older.verdict} → ${newer.verdict}`,
    scoreDelta,
    ...sub,
  }
}

export function collectWhatChangedDigests(lineages: IdeaLineage[]): WhatChangedDigest[] {
  const out: WhatChangedDigest[] = []
  for (const L of lineages) {
    const d = buildWhatChangedDigest(L)
    if (d) out.push(d)
  }
  return out.slice(0, 12)
}
