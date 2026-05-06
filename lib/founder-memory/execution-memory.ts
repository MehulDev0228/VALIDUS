import type {
  ExecutionCheckinEvent,
  ExecutionPlanEvent,
  TimelineEvent,
} from "@/lib/founder-memory/types"

export type ExecutionPatternLine = {
  id: string
  text: string
  basis: "checkin_counts" | "task_keywords"
}

const BUCKETS: Array<{ id: string; label: string; re: RegExp }> = [
  { id: "pricing", label: "pricing or payment", re: /\b(pric(e|ing)?|deposit|checkout|invoice|pilot\s+fee|wallet|budget)\b/i },
  {
    id: "acquisition",
    label: "acquisition or distribution",
    re: /\b(outbound|linkedin|cold|ads|growth|distribution|landing|signup|activation)\b/i,
  },
  { id: "interview", label: "discovery interviews", re: /\b(interview|conversation|discovery|custdev|five\s+buyers)\b/i },
  {
    id: "workflow_ops",
    label: "workflow or operations",
    re: /\b(workflow|spreadsheet|export|csv|concierge|manual|ticket|ops|slack)\b/i,
  },
  {
    id: "liquidity",
    label: "liquidity or marketplace density",
    re: /\b(liquidity|marketplace|supply|demand|density|two-?sided)\b/i,
  },
]

/**
 * Behavior-backed execution habit lines from check-ins + task copy — no psychological labels.
 */
export function inferExecutionPatterns(timeline: TimelineEvent[]): ExecutionPatternLine[] {
  const plans = new Map<string, ExecutionPlanEvent>()
  for (const e of timeline) {
    if (e.kind === "execution_plan") plans.set(e.id, e)
  }

  const checkins = timeline.filter((e): e is ExecutionCheckinEvent => e.kind === "execution_checkin")
  if (checkins.length === 0) return []

  const lines: ExecutionPatternLine[] = []
  let completed = 0
  let partial = 0
  let ignored = 0
  let blocked = 0
  let disproven = 0
  let strong = 0

  const bucketHits: Record<string, { ignored: number; blocked: number; done: number; total: number }> = {}
  for (const b of BUCKETS) {
    bucketHits[b.id] = { ignored: 0, blocked: 0, done: 0, total: 0 }
  }

  for (const c of checkins) {
    switch (c.status) {
      case "completed":
        completed++
        break
      case "partial":
        partial++
        break
      case "ignored":
        ignored++
        break
      case "blocked":
        blocked++
        break
      case "disproven":
        disproven++
        break
      case "strong_signal":
        strong++
        break
      default:
        break
    }

    const plan = plans.get(c.planId)
    const taskText = plan?.tasks.find((t) => t.taskId === c.taskId)?.text ?? ""
    for (const b of BUCKETS) {
      if (!b.re.test(taskText)) continue
      bucketHits[b.id]!.total++
      if (c.status === "ignored" || c.status === "blocked") {
        bucketHits[b.id]!.ignored += c.status === "ignored" ? 1 : 0
        bucketHits[b.id]!.blocked += c.status === "blocked" ? 1 : 0
      }
      if (c.status === "completed" || c.status === "strong_signal") {
        bucketHits[b.id]!.done++
      }
    }
  }

  const n = checkins.length
  if (ignored >= 4 && completed + strong <= Math.max(1, Math.floor(ignored / 4))) {
    lines.push({
      id: "ignored_vs_done",
      text: "Execution check-ins skew ignored relative to completions — tasks may be oversized, or outcomes not being logged when partial progress exists.",
      basis: "checkin_counts",
    })
  }

  if (blocked >= 3 && blocked >= completed) {
    lines.push({
      id: "blocked_cluster",
      text: "Several tasks surface as blocked — worth listing the external dependency once (legal, partner, data access) and shrinking the falsification step.",
      basis: "checkin_counts",
    })
  }

  if (disproven >= 2) {
    lines.push({
      id: "disproven_signal",
      text: "Multiple items marked disproven — you are recording negative evidence; make sure the next memo encodes those reversals so the stack stops re-arguing defeated assumptions.",
      basis: "checkin_counts",
    })
  }

  if (partial >= completed + strong && partial >= 3) {
    lines.push({
      id: "partial_wins",
      text: "Several partial completions logged — capturing what shipped (even narrowly) closes the gap between decks and receipts.",
      basis: "checkin_counts",
    })
  }

  for (const b of BUCKETS) {
    const h = bucketHits[b.id]!
    if (h.total < 3) continue
    const stuck = h.ignored + h.blocked
    if (stuck >= 2 && stuck >= h.done) {
      lines.push({
        id: `bucket_${b.id}`,
        text: `Tasks touching ${b.label} show more ignored or blocked check-ins than finished ones in your history (${stuck} vs ${h.done}).`,
        basis: "task_keywords",
      })
    }
  }

  /** Require minimum history so we don't over-speak early */
  if (n < 4) return lines.slice(0, 4)

  return lines.slice(0, 8)
}
