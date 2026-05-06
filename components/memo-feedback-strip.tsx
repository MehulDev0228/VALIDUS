"use client"

import { useState } from "react"
import type { ReportFeedbackTag, VerdictLean } from "@/lib/founder-memory/types"

const TRUST_TAGS: Array<{ id: ReportFeedbackTag; label: string }> = [
  { id: "useful", label: "Useful" },
  { id: "accurate", label: "Accurate" },
  { id: "actionable", label: "Actionable" },
  { id: "changed_thinking", label: "Changed my thinking" },
]

const EDGE_TAGS: Array<{ id: ReportFeedbackTag; label: string }> = [
  { id: "insightful", label: "Insightful" },
  { id: "inaccurate", label: "Missed the mark" },
  { id: "repetitive", label: "Repetitive" },
  { id: "harsh_but_fair", label: "Harsh but fair" },
  { id: "too_harsh", label: "Too harsh" },
  { id: "too_generic", label: "Too generic" },
]

/**
 * Private calibration — one tap + optional note. Feeds founder trust data only.
 */
export function MemoFeedbackStrip({
  ideaId,
  verdict,
  disabled,
}: {
  ideaId: string | null
  verdict: VerdictLean
  disabled?: boolean
}) {
  const [busyTag, setBusyTag] = useState<ReportFeedbackTag | null>(null)
  const [sent, setSent] = useState<ReportFeedbackTag | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function send(tag: ReportFeedbackTag) {
    setErr(null)
    if (!ideaId) {
      setErr("Run id missing — memo not bound to a filing.")
      return
    }
    setBusyTag(tag)
    try {
      void fetch("/api/metrics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "memo_calibration", payload: { tag } }),
      }).catch(() => {})
      const res = await fetch("/api/founder-memory/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "report_feedback",
          ideaId,
          verdict,
          tags: [tag],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not save")
      setSent(tag)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusyTag(null)
    }
  }

  function row(tagList: typeof TRUST_TAGS) {
    return (
      <div className="mt-5 flex flex-wrap gap-2">
        {tagList.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            disabled={disabled || Boolean(sent) || busyTag !== null}
            onClick={() => void send(id)}
            className={`border px-3 py-2 text-[13px] leading-none transition-colors disabled:opacity-40 ${
              sent === id ? "border-verdict-build text-verdict-build" : "border-bone-0/15 text-bone-1 hover:border-bone-0/30 hover:text-bone-0"
            }`}
          >
            {busyTag === id ? "…" : label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-bone-0/[0.03] p-6 md:p-8">
      <div className="mono-caption text-bone-2">Trust signal · only your archive reads this</div>
      <p className="mt-3 max-w-[540px] text-[15px] leading-relaxed text-bone-0">
        Quiet pulse check — helps us sharpen tone without turning this into Yelp for founders.
      </p>
      {!ideaId ? (
        <p className="mono-caption mt-4 text-bone-2">Attach a memo by refiling once signed in — we need an id on record.</p>
      ) : (
        <>
          <p className="mono-caption mt-6 text-bone-2">Trust & usefulness</p>
          {row(TRUST_TAGS)}
          <p className="mono-caption mt-8 text-bone-2">Tone & shape</p>
          {row(EDGE_TAGS)}
        </>
      )}
      {sent && (
        <p className="mono-caption mt-6 text-bone-2">
          Logged privately to your longitudinal file — no public scoreboard choreography.
        </p>
      )}
      {err && <p className="mono-caption mt-4 text-verdict-kill">{err}</p>}
    </div>
  )
}
