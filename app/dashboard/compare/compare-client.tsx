"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ease } from "@/lib/motion"

type RunPayload = {
  success?: boolean
  validation_results?: Record<string, unknown>
  idea_id?: string
}

function scoreFromFree(free: Record<string, unknown>): number {
  if (typeof free.opportunityScore === "number") return Math.round(free.opportunityScore)
  if (typeof free.score === "number") return Math.round((free.score as number) * 10)
  return 0
}

function verdictFromFree(free: Record<string, unknown>): string {
  const d = (free.finalVerdict as { decision?: string } | undefined)?.decision
  if (d === "BUILD" || d === "PIVOT" || d === "KILL") return d
  const c = free.classification as string | undefined
  if (c === "high") return "BUILD"
  if (c === "low") return "KILL"
  return "PIVOT"
}

function breakdownRows(free: Record<string, unknown>) {
  const sb = free.scoreBreakdown as Record<string, number> | undefined
  if (sb && typeof sb.market === "number") {
    return [
      { k: "Market", v: sb.market / 10 },
      { k: "Competition", v: sb.competition / 10 },
      { k: "Monetization", v: sb.monetization / 10 },
      { k: "Execution", v: sb.execution / 10 },
      { k: "Founder fit", v: sb.founderFit / 10 },
    ]
  }
  return [
    { k: "Market", v: 0.5 },
    { k: "Competition", v: 0.5 },
    { k: "Monetization", v: 0.5 },
  ]
}

export function CompareClient() {
  const sp = useSearchParams()
  const a = sp.get("a")?.trim() || ""
  const b = sp.get("b")?.trim() || ""

  const [left, setLeft] = useState<Record<string, unknown> | null>(null)
  const [right, setRight] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!a || !b) {
        setLeft(null)
        setRight(null)
        setErr(null)
        return
      }
      setLoading(true)
      setErr(null)
      try {
        const [ra, rb] = await Promise.all([
          fetch(`/api/validation-run?id=${encodeURIComponent(a)}`, { credentials: "same-origin" }),
          fetch(`/api/validation-run?id=${encodeURIComponent(b)}`, { credentials: "same-origin" }),
        ])
        const ja = (await ra.json()) as RunPayload
        const jb = (await rb.json()) as RunPayload
        if (cancelled) return
        if (!ja.success || !ja.validation_results) {
          setErr("Could not load memo A — check the run id.")
          setLeft(null)
          setRight(null)
          return
        }
        if (!jb.success || !jb.validation_results) {
          setErr("Could not load memo B — check the run id.")
          setLeft(null)
          setRight(null)
          return
        }
        setLeft(ja.validation_results as Record<string, unknown>)
        setRight(jb.validation_results as Record<string, unknown>)
      } catch {
        if (!cancelled) setErr("Network error loading memos.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [a, b])

  const diffRows = useMemo(() => {
    if (!left || !right) return []
    const L = breakdownRows(left)
    const R = breakdownRows(right)
    const keys = new Set([...L.map((x) => x.k), ...R.map((x) => x.k)])
    const out: Array<{ k: string; lv: number; rv: number; delta: number }> = []
    for (const k of keys) {
      const lv = L.find((x) => x.k === k)?.v ?? 0
      const rv = R.find((x) => x.k === k)?.v ?? 0
      out.push({ k, lv, rv, delta: Math.round((rv - lv) * 100) })
    }
    return out
  }, [left, right])

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-10 md:px-10">
      <header className="border-b border-bone-0/10 pb-8">
        <p className="marketing-label text-ember/80">Power tool</p>
        <h1 className="font-serif text-[clamp(28px,3.5vw,44px)] leading-tight tracking-[-0.025em]">
          Memo comparison
        </h1>
        <p className="marketing-body mt-4 max-w-[640px]">
          Paste two run ids from your results URL (<span className="mono-caption text-bone-1">?run=…</span>). Side-by-side
          verdict and score diff — screenshot-friendly.
        </p>
      </header>

      <form className="mt-10 grid gap-4 md:grid-cols-2" action="/dashboard/compare" method="get">
        <label className="block">
          <span className="mono-caption text-bone-2">Run A</span>
          <input
            name="a"
            defaultValue={a}
            placeholder="run_…"
            className="mt-2 w-full rounded-sm border border-bone-0/15 bg-ink-0 px-4 py-3 font-mono text-[13px] text-bone-0 outline-none focus:border-ember/40"
          />
        </label>
        <label className="block">
          <span className="mono-caption text-bone-2">Run B</span>
          <input
            name="b"
            defaultValue={b}
            placeholder="run_…"
            className="mt-2 w-full rounded-sm border border-bone-0/15 bg-ink-0 px-4 py-3 font-mono text-[13px] text-bone-0 outline-none focus:border-ember/40"
          />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="tab-cta">
            <span>Compare</span>
            <span className="tab-cta-arrow">→</span>
          </button>
        </div>
      </form>

      {loading ? <p className="mono-caption mt-10 text-bone-2">Loading…</p> : null}
      {err ? <p className="mt-10 text-[14px] text-verdict-pivot">{err}</p> : null}

      {left && right ? (
        <div className="mt-14 space-y-12">
          <div className="grid gap-8 md:grid-cols-2">
            <MemoCard label="A" free={left} />
            <MemoCard label="B" free={right} />
          </div>

          <section>
            <h2 className="font-serif text-[22px] tracking-[-0.02em]">Score breakdown diff</h2>
            <p className="mono-caption mt-2 text-bone-2">Green = B higher vs A · Red = B lower vs A</p>
            <ul className="mt-8 space-y-6">
              {diffRows.map((row) => (
                <li key={row.k}>
                  <div className="mono-caption mb-2 flex justify-between">
                    <span>{row.k}</span>
                    <span
                      className={
                        row.delta === 0
                          ? "text-bone-2"
                          : row.delta > 0
                            ? "text-verdict-build"
                            : "text-verdict-kill"
                      }
                    >
                      {row.delta > 0 ? "+" : ""}
                      {row.delta}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-2 rounded-full bg-bone-0/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, row.lv * 100))}%` }}
                        transition={{ duration: 0.6, ease: ease.editorial }}
                        className="h-2 rounded-full bg-bone-0/50"
                      />
                    </div>
                    <div className="h-2 rounded-full bg-bone-0/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, row.rv * 100))}%` }}
                        transition={{ duration: 0.6, ease: ease.editorial }}
                        className="h-2 rounded-full bg-ember/60"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {!a || !b ? (
        <p className="mono-caption mt-12 text-bone-2">Enter both run ids to compare.</p>
      ) : null}

      <div className="mt-16">
        <Link href="/dashboard/validate" className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0">
          ← Back to Validate
        </Link>
      </div>
    </div>
  )
}

function MemoCard({ label, free }: { label: string; free: Record<string, unknown> }) {
  const verdict = verdictFromFree(free)
  const score = scoreFromFree(free)
  const title =
    (typeof free.idea_title === "string" && free.idea_title) ||
    (free.ideaContext as { coreIdea?: string } | undefined)?.coreIdea ||
    "Idea"
  const tone =
    verdict === "BUILD"
      ? "text-verdict-build"
      : verdict === "KILL"
        ? "text-verdict-kill"
        : "text-verdict-pivot"

  return (
    <div className="warm-surface rounded-sm border border-bone-0/[0.06] p-6 md:p-8">
      <div className="mono-caption text-bone-2">Memo {label}</div>
      <div className={`mt-3 font-sans text-[44px] font-semibold leading-none tracking-[-0.04em] ${tone}`}>{verdict}</div>
      <div className="tabular mt-4 font-sans text-[28px] text-bone-0">
        {score}
        <span className="text-bone-2 text-[0.55em]">/100</span>
      </div>
      <p className="mt-6 font-serif text-[17px] leading-snug text-bone-1">{title}</p>
    </div>
  )
}
