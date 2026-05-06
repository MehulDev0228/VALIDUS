import type { ExecutionTaskAnchor, ExecutionTaskItem, MemoProgressionSnapshot, VerdictLean } from "@/lib/founder-memory/types"

function clip(s: string, n: number): string {
  const t = s.trim()
  return t.length <= n ? t : `${t.slice(0, Math.max(0, n - 1))}…`
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

/**
 * Operator-level falsification tasks (3–5) derived from persisted memo snapshots — deterministic, explainable.
 */
export function deriveExecutionTaskItems(
  snap: MemoProgressionSnapshot,
  ctx: { ideaTitle: string; ideaExcerpt: string; verdict: VerdictLean },
): ExecutionTaskItem[] {
  const out: ExecutionTaskItem[] = []
  let seq = 0

  const add = (text: string, anchor: ExecutionTaskAnchor, anchorQuote?: string) => {
    const n = norm(text)
    if (!n || out.some((o) => norm(o.text) === n)) return
    seq += 1
    out.push({
      taskId: `t_${seq}`,
      text: clip(text, 440),
      anchor,
      anchorQuote: anchorQuote ? clip(anchorQuote, 200) : undefined,
    })
  }

  const title = clip(ctx.ideaTitle, 80)
  const excerpt = clip(ctx.ideaExcerpt, 160)

  for (const r of snap.risks.slice(0, 2)) {
    const rq = clip(r, 200)
    add(
      `Within 48h: interview 5 buyers or operators who already spend (time or budget) on a substitute for this failure mode: ${rq}. Log who signs spend, how often the pain fires, and one export or ticket that proves the workaround.`,
      "risk",
      r,
    )
  }

  for (const g of snap.validationGaps.slice(0, 2)) {
    const gq = clip(g, 200)
    add(
      `Close this validation gap — ${gq} — with one tangible artifact only (screenshots of a procurement thread, spreadsheet export timestamped over a week, or a signed informal PO). Avoid survey summaries as evidence.`,
      "gap",
      g,
    )
  }

  /** Prefer memo assumptions first, then gaps not already tasked */
  const asms = [...snap.assumptions, ...snap.validationGaps.filter((x) => !snap.assumptions.includes(x))].slice(
    0,
    6,
  )

  for (const a of asms) {
    if (out.length >= 5) break
    const aq = clip(a, 200)
    add(
      `Falsify “${aq}” with a removal or prepaid checkpoint: propose a scoped pilot with a deposits-or-nothing gate; write down a numeric stop rule before you meet anyone (for example halt if three qualified buyers refuse a calendar hold).`,
      "assumption",
      a,
    )
  }

  if (snap.ifFailsBecause?.trim()) {
    add(
      `Stress-test the primary failure mode verbatim: ${clip(snap.ifFailsBecause, 220)} — run one concierge step manually (no new software) across three accounts and timestamp where the process breaks.`,
      "failure_mode",
      snap.ifFailsBecause,
    )
  }

  if (snap.pivotTitles[0]?.trim()) {
    add(
      `If you tilt toward wedge “${clip(snap.pivotTitles[0]!, 100)}”: pick a single geography or single role title, list 25 named accounts, and attempt three paid or pilot conversations before expanding surface area.`,
      "wedge",
      snap.pivotTitles[0],
    )
  }

  /** Marketplace / liquidity language in snapshot */
  const blob = `${ctx.ideaTitle}\n${ctx.ideaExcerpt}\n${snap.risks.join(" ")}`.toLowerCase()
  const looksMarketplace =
    /\b(marketplace|two-?sided|supply|demand|liquidity|density|riders|hosts|buyers\s+and\s+sellers)\b/i.test(blob)
  if (looksMarketplace && out.length < 5) {
    add(
      `Map liquidity density for “${title}” in one city or niche: tally active listings versus intent (inbound inquiries or qualified leads) weekly; stop if the ratio cannot tighten in three measurement cycles.`,
      "risk",
      "marketplace liquidity",
    )
  }

  if (out.length < 3) {
    add(
      `Shadow one live workflow tied to ${title}: record every tab switch or manual export for "${excerpt || "your wedge"}" across three consecutive business days — quantify minutes lost per occurrence.`,
      "gap",
      "workflow uncertainty",
    )
  }

  if (ctx.verdict === "KILL" && out.length < 5) {
    add(
      `Before shelving “${title}”: run a single humane exit interview with one serious prospect who declined — isolate whether the kill was wedge, timing, buyer, or offer structure.`,
      "assumption",
      "kill discipline",
    )
  }

  if (out.length === 0) {
    add(
      `48h smoke: three buyer conversations on “${title}” with a one-page offer; log objections and any informal budget signal — no deck edits until those notes exist.`,
      "gap",
    )
  }

  return out.slice(0, 5)
}
