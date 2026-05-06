"use client"

import { useCallback, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { ExecutionWorkspacePayload } from "@/lib/founder-memory/execution-workspace"

function formatDay(iso: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return "—"
  return new Date(ms).toISOString().slice(0, 10)
}

type StatusKey =
  | "completed"
  | "partial"
  | "ignored"
  | "blocked"
  | "disproven"
  | "strong_signal"

const STATUS_ROWS: Array<{ key: StatusKey; label: string }> = [
  { key: "completed", label: "done" },
  { key: "partial", label: "partial" },
  { key: "ignored", label: "ignored" },
  { key: "blocked", label: "blocked" },
  { key: "disproven", label: "disproven" },
  { key: "strong_signal", label: "signal" },
]

export function FounderWorkspaceExecution({
  execution,
  onRefresh,
}: {
  execution: ExecutionWorkspacePayload
  onRefresh: () => void
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const recentLine = useMemo(() => {
    const parts = Object.entries(execution.recent.byStatus)
      .filter(([, n]) => (n ?? 0) > 0)
      .map(([k, n]) => `${k.replace(/_/g, " ")} ${n}`)
    if (parts.length === 0 && execution.recent.checkinTotal === 0) return "No check-ins in this window yet."
    return `${execution.recent.checkinTotal} check-ins · ${parts.join(" · ") || "status mix"}`
  }, [execution.recent])

  const postCheckin = useCallback(
    async (
      planId: string,
      taskId: string,
      ideaKey: string | undefined,
      status: StatusKey,
      note: string,
      linkedAssumption?: string,
    ) => {
      const k = `${planId}:${taskId}:${status}`
      setBusy(k)
      setErr(null)
      try {
        const res = await fetch("/api/founder-memory/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "execution_checkin",
            planId,
            taskId,
            status,
            note: note.trim(),
            ideaKey,
            linkedAssumption: linkedAssumption?.trim() ? linkedAssumption.trim().slice(0, 520) : undefined,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        if (user?.id) {
          void fetch("/api/product-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              events: [
                {
                  kind: "execution_checkin_product",
                  ideaKey,
                  meta: { planId, taskId, status },
                },
              ],
            }),
          }).catch(() => {})
        }
        onRefresh()
      } catch {
        setErr("Check-in did not persist. Try again.")
      } finally {
        setBusy(null)
      }
    },
    [onRefresh, user?.id],
  )

  return (
    <div className="space-y-20">
      <section>
        <h2 className="font-serif text-[22px] tracking-[-0.02em]">Execution stack</h2>
        <p className="mono-caption mt-2 text-bone-2">
          Tasks generated from memo structure when you file · check-ins are receipts, not scores.
        </p>
        <p className="mono-caption mt-3 text-bone-2">{recentLine}</p>
        {execution.taskPacks.length === 0 ? (
          <p className="mt-6 text-[15px] text-bone-1">File a memo with a captured snapshot — the next verdict seeds an execution plan automatically.</p>
        ) : (
          <ul className="mt-8 space-y-12">
            {execution.taskPacks.map((pack) => (
              <li key={pack.planId} className="border border-bone-0/10 p-6 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-bone-0/10 pb-4">
                  <div>
                    <div className="mono-caption text-bone-2">Thread</div>
                    <h3 className="mt-1 font-serif text-[18px] text-bone-0">{pack.threadLabel}</h3>
                  </div>
                  <span className="mono-caption tabular text-bone-2">
                    plan {formatDay(pack.at)} · verdict {formatDay(pack.verdictAt)}
                  </span>
                </div>
                <ol className="mt-6 space-y-10">
                  {pack.tasks.map((t) => (
                    <li key={t.taskId} className="border-l-2 border-bone-0/15 pl-5">
                      <p className="text-[14px] leading-relaxed text-bone-0">{t.text}</p>
                      <p className="mono-caption mt-2 text-bone-2">anchor · {t.anchor}</p>
                      {t.checkins.length > 0 && (
                        <ul className="mt-3 space-y-2 border-t border-bone-0/[0.06] pt-3">
                          {t.checkins.map((c, i) => (
                            <li key={`${c.at}-${i}`} className="text-[13px] text-bone-2">
                              <span className="tabular text-bone-2">{formatDay(c.at)}</span> ·{" "}
                              <span className="text-bone-0">{c.status.replace(/_/g, " ")}</span>
                              {c.note ? <span> · {c.note}</span> : null}
                            </li>
                          ))}
                        </ul>
                      )}
                      <TaskCheckBar
                        scopeKey={`${pack.planId}:${t.taskId}`}
                        pendingKey={busy}
                        onSubmit={(status, note, assumption) =>
                          void postCheckin(pack.planId, t.taskId, pack.ideaKey, status, note, assumption)
                        }
                      />
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
        {err ? <p className="mono-caption mt-6 text-verdict-kill">{err}</p> : null}
      </section>

      <section>
        <h2 className="font-serif text-[22px] tracking-[-0.02em]">Theory vs reality</h2>
        <p className="mono-caption mt-2 text-bone-2">
          Assumptions from the latest memo snapshot matched to experiments or linked check-ins — heuristic overlap only.
        </p>
        {execution.theoryVsReality.length === 0 ? (
          <p className="mt-6 text-[15px] text-bone-1">Log experiments after a filing, or link an assumption when you check in.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {execution.theoryVsReality.map((row) => (
              <li key={row.id} className="border border-bone-0/10 p-5 md:p-6">
                <div className="mono-caption text-bone-2">{row.label}</div>
                <p className="mt-2 text-[15px] leading-relaxed text-bone-0">
                  <span className="text-bone-2">Assumption — </span>
                  {row.assumption}
                </p>
                {row.predictedPressure ? (
                  <p className="mt-3 text-[14px] text-bone-1">
                    <span className="text-bone-2">Memo pressure — </span>
                    {row.predictedPressure}
                  </p>
                ) : null}
                <p className="mt-3 text-[14px] leading-relaxed text-bone-1">
                  <span className="text-bone-2">Field — </span>
                  {row.reality}
                </p>
                <p className="mono-caption mt-2 text-bone-2">{row.basis}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-[22px] tracking-[-0.02em]">Execution habit signals</h2>
        <p className="mono-caption mt-2 text-bone-2">Counts and task wording only — surfaced when thresholds pass.</p>
        {execution.executionPatterns.length === 0 ? (
          <p className="mt-6 text-[15px] text-bone-1">More dated check-ins will unlock this sparingly.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {execution.executionPatterns.map((p) => (
              <li key={p.id} className="border-l-2 border-bone-0/25 pl-4">
                <p className="text-[15px] leading-relaxed text-bone-0">{p.text}</p>
                <p className="mono-caption mt-2 text-bone-2">{p.basis.replace(/_/g, " · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-[22px] tracking-[-0.02em]">Validation trajectory</h2>
        <p className="mono-caption mt-2 text-bone-2">
          Opportunity scores and verdicts across re-files — each list runs oldest → newest.
        </p>
        {execution.validationEvolution.length === 0 ? (
          <p className="mt-6 text-[15px] text-bone-1">No lineage yet.</p>
        ) : (
          <ul className="mt-8 space-y-8">
            {execution.validationEvolution.map((row) => (
              <li key={row.ideaKey} className="border border-bone-0/10 p-5 md:p-6">
                <div className="font-serif text-[17px] text-bone-0">{row.label}</div>
                <p className="mono-caption mt-2 text-bone-2">
                  {row.scoreDelta != null ? `Score delta across thread: ${row.scoreDelta > 0 ? "+" : ""}${row.scoreDelta}` : "Score delta: —"}
                  {row.verdictShift ? ` · ${row.verdictShift}` : ""}
                </p>
                <ol className="mt-4 space-y-2 border-l border-bone-0/15 pl-4">
                  {row.points.map((p, i) => (
                    <li key={`${p.at}-${i}`} className="text-[13px] text-bone-1">
                      <span className="tabular text-bone-2">{formatDay(p.at)}</span> · {p.verdict}
                      {p.score != null ? ` · ${p.score}/100` : ""}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function TaskCheckBar({
  onSubmit,
  scopeKey,
  pendingKey,
}: {
  scopeKey: string
  pendingKey: string | null
  onSubmit: (status: StatusKey, note: string, linkedAssumption?: string) => void
}) {
  const [note, setNote] = useState("")
  const [assumptionLink, setAssumptionLink] = useState("")
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_ROWS.map((s) => {
          const full = `${scopeKey}:${s.key}`
          const pend = pendingKey === full
          return (
            <button
              key={s.key}
              type="button"
              disabled={pendingKey !== null}
              onClick={() => {
                const a = assumptionLink.trim()
                onSubmit(s.key, note, a || undefined)
                setNote("")
                setAssumptionLink("")
              }}
              className={`mono-caption border px-2 py-1 transition-colors hover:border-bone-0/35 hover:bg-bone-0/[0.04] ${
                pend ? "border-bone-0/35 text-bone-2" : "border-bone-0/15 text-bone-1"
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
      <input
        type="text"
        value={note}
        placeholder="Optional note · receipts, dependency, blocker"
        onChange={(e) => setNote(e.target.value)}
        className="mt-3 w-full border border-bone-0/10 bg-transparent px-3 py-2 text-[13px] text-bone-0 outline-none placeholder:text-bone-2 focus:border-bone-0/25"
        maxLength={2000}
      />
      <input
        type="text"
        value={assumptionLink}
        placeholder="Link an assumption verbatim (optional, for theory vs reality)"
        onChange={(e) => setAssumptionLink(e.target.value)}
        className="mt-2 w-full border border-bone-0/10 bg-transparent px-3 py-2 text-[13px] text-bone-0 outline-none placeholder:text-bone-2 focus:border-bone-0/25"
        maxLength={520}
      />
    </div>
  )
}
