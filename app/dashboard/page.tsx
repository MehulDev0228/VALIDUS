"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardOperatingSpine } from "@/components/dashboard-operating-spine"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import type { ProgressionWorkspacePayload } from "@/lib/founder-memory/bundle"
import type { ExecutionWorkspacePayload } from "@/lib/founder-memory/execution-workspace"
import type { BlindSpotObservation } from "@/lib/founder-memory/types"
import { readDecisionHistory } from "@/lib/founder-workflow/storage"
import type { DecisionRecord } from "@/lib/founder-workflow/types"

type Verdict = "BUILD" | "PIVOT" | "KILL"

function recordTimeMs(r: DecisionRecord): number {
  const raw = r.timestamp || r.createdAt
  const ms = raw ? Date.parse(raw) : Number.NaN
  return Number.isFinite(ms) ? ms : 0
}

function recordDateLabel(r: DecisionRecord): string {
  const ms = recordTimeMs(r)
  if (!ms) return "unknown"
  return new Date(ms).toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [records, setRecords] = useState<DecisionRecord[]>([])
  const [serverRecords, setServerRecords] = useState<DecisionRecord[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; resetInSeconds: number } | null>(null)
  const [draft, setDraft] = useState("")
  const [fmBusy, setFmBusy] = useState(true)
  const [fm, setFm] = useState<{
    journeyLines: string[]
    execution: ExecutionWorkspacePayload | null
    progression: ProgressionWorkspacePayload | null
    blindSpots: BlindSpotObservation[]
  } | null>(null)

  // Auth gate
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/dashboard")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setFmBusy(true)
    fetch("/api/founder-memory")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return
        if (!j?.success) {
          setFm({
            journeyLines: [],
            execution: null,
            progression: null,
            blindSpots: [],
          })
          setFmBusy(false)
          return
        }
        if (!j.onboarding) {
          router.replace(`/dashboard/onboarding?next=${encodeURIComponent("/dashboard")}`)
          return
        }
        setFm({
          journeyLines: Array.isArray(j.journeyLines) ? j.journeyLines : [],
          execution: j.execution ?? null,
          progression: j.progression ?? null,
          blindSpots: Array.isArray(j.blindSpots) ? j.blindSpots : [],
        })
        try {
          const sess = sessionStorage.getItem("fv_dash_trust_sess")
          if (!sess) {
            sessionStorage.setItem("fv_dash_trust_sess", "1")
            void fetch("/api/founder-memory/trust", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "dashboard_session" }),
            })
          }
          const piHome = sessionStorage.getItem("fv_pi_workspace_home")
          if (!piHome) {
            sessionStorage.setItem("fv_pi_workspace_home", "1")
            void fetch("/api/product-events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ events: [{ kind: "workspace_home_open" }] }),
            }).catch(() => {})
          }
        } catch {}
        setFmBusy(false)
      })
      .catch(() => {
        if (!cancelled) {
          setFm({
            journeyLines: [],
            execution: null,
            progression: null,
            blindSpots: [],
          })
          setFmBusy(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, router])

  useEffect(() => {
    setRecords(readDecisionHistory())
    setHydrated(true)

    fetch("/api/decision-history")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.records)) setServerRecords(j.records as DecisionRecord[])
        else if (Array.isArray(j?.decisions)) setServerRecords(j.decisions as DecisionRecord[])
      })
      .catch(() => {})
  }, [])

  // Live usage
  useEffect(() => {
    if (!user) return
    const fp = readFingerprint()
    fetch(`/api/usage?user_id=${encodeURIComponent(user.id)}&fingerprint=${encodeURIComponent(fp || "")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success) setUsage({ used: j.used, limit: j.limit, resetInSeconds: j.resetInSeconds })
      })
      .catch(() => {})
  }, [user])

  const merged = useMemo(() => {
    const byKey = new Map<string, DecisionRecord>()
    for (const r of [...serverRecords, ...records]) {
      const key = `${r.ideaId}::${recordTimeMs(r)}`
      if (!byKey.has(key)) byKey.set(key, r)
    }
    return Array.from(byKey.values()).sort((a, b) => recordTimeMs(b) - recordTimeMs(a))
  }, [records, serverRecords])

  function handleQuickFile() {
    if (!draft.trim() || draft.trim().length < 8) return
    try {
      const payload = {
        title: draft.slice(0, 80).trim(),
        description: draft.trim(),
      }
      localStorage.setItem("fv_prefill_validate", JSON.stringify(payload))
    } catch {}
    router.push("/dashboard/validate")
  }

  const dboard = microcopy.dashboard

  if (loading || !user || fmBusy || fm === null) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="grid h-[60vh] place-items-center">
          <span className="mono-caption tabular text-bone-2">{dboard.loading}</span>
        </main>
      </div>
    )
  }

  const used = usage?.used ?? 0
  const limit = usage?.limit ?? 2
  const remaining = Math.max(0, limit - used)
  const limitReached = remaining === 0
  const contextLine = getContextLine(merged.length, merged[0])

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />

      <main className="mx-auto max-w-[1040px] px-6 pb-32 pt-8 md:px-10 md:pt-12">
        {/* CONTEXT LINE — quiet, informative, non-dominant */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: ease.editorial }}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-[15px] leading-relaxed text-bone-1">
            {contextLine}
          </p>
          <span className="mono-caption tabular text-bone-2">
            {remaining} of {limit} today
            {limitReached && usage?.resetInSeconds ? (
              <span> · resets in <ResetCountdown seconds={usage.resetInSeconds} /></span>
            ) : null}
          </span>
        </motion.div>

        {/* QUICK BRIEF — the hero element. Notebook energy. */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: ease.editorial }}
          className="mt-8 md:mt-10"
        >
          <div className="bg-bone-0/[0.025] p-6 md:p-8" data-cursor="input">
            <textarea
              rows={2}
              value={draft}
              disabled={limitReached}
              onChange={(e) => {
                setDraft(e.target.value)
                autosize(e.currentTarget)
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleQuickFile()
              }}
              placeholder={
                limitReached
                  ? dboard.quickBriefPlaceholderDisabled
                  : "The idea that won\u2019t leave\u2026"
              }
              className="w-full resize-none border-0 bg-transparent font-serif text-[clamp(22px,2.8vw,36px)] leading-[1.25] tracking-[-0.015em] text-bone-0 placeholder:text-bone-2/50 focus:outline-none disabled:opacity-40"
              autoFocus
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-bone-0/[0.05] pt-4">
              <span className="mono-caption tabular text-bone-2">
                {draft.length > 0 ? `${draft.length} chars` : ""} {draft.length > 0 ? "· " : ""}⌘⏎ to file
              </span>
              <button
                type="button"
                onClick={handleQuickFile}
                disabled={limitReached || draft.trim().length < 8}
                className={`tab-cta ${limitReached || draft.trim().length < 8 ? "pointer-events-none opacity-40" : ""}`}
              >
                <span>{dboard.quickBriefSubmit}</span>
                <span className="tab-cta-arrow">→</span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* DECISION LEDGER — the journal */}
        <section className="mt-16 md:mt-20">
          <header className="mb-5 flex items-end justify-between border-b border-bone-0/[0.06] pb-5">
            <div>
              <p className="mono-caption">{dboard.ledgerEyebrow}</p>
              <h2 className="mt-2 font-serif text-[clamp(24px,3vw,36px)] leading-tight tracking-[-0.02em]">
                {dboard.ledgerTitle}
              </h2>
            </div>
            <Link href="/dashboard/validate" className="tab-cta" data-cursor="file">
              <span className="hidden sm:inline">{dboard.nav.memo}</span>
              <span className="sm:hidden">File</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
          </header>

          {!hydrated ? (
            <div className="mono-caption tabular text-bone-2">loading…</div>
          ) : merged.length === 0 ? (
            <EmptyLedger />
          ) : (
            <ul className="border-y border-bone-0/[0.08]">
              {merged.slice(0, 12).map((r, i) => (
                <RecordRow key={`${r.ideaId}-${r.timestamp}-${i}`} r={r} />
              ))}
            </ul>
          )}

          {merged.length > 12 && (
            <p className="mono-caption mt-5 tabular text-bone-2">
              {merged.length - 12} {microcopy.dashboard.archivedMore}
            </p>
          )}
        </section>

        {/* OPERATING SPINE — secondary context, lower on page */}
        {(fm.journeyLines.length > 0 || fm.execution || fm.progression || fm.blindSpots.length > 0) && (
          <section className="mt-20">
            <DashboardOperatingSpine
              journeyLines={fm.journeyLines}
              execution={fm.execution}
              progression={fm.progression}
              blindSpots={fm.blindSpots}
            />
          </section>
        )}
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ResetCountdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds)
  useEffect(() => {
    setS(seconds)
    const id = setInterval(() => setS((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds])
  if (s <= 0) return <span className="tabular">—</span>
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return (
    <span className="tabular">
      {h}h {String(m).padStart(2, "0")}m
    </span>
  )
}

function RecordRow({ r }: { r: DecisionRecord }) {
  const verdict = (r.verdict as Verdict) || "PIVOT"
  const tone =
    verdict === "BUILD" ? "text-verdict-build" : verdict === "KILL" ? "text-verdict-kill" : "text-verdict-pivot"
  const accent =
    verdict === "BUILD" ? "bg-verdict-build" : verdict === "KILL" ? "bg-verdict-kill" : "bg-verdict-pivot"
  const date = recordDateLabel(r)
  const score = r.opportunityScore != null ? Math.round(r.opportunityScore) : null

  return (
    <li
      className="group relative border-b border-bone-0/[0.08] last:border-b-0"
    >
      <div className={`absolute left-0 top-0 h-full w-px ${accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} aria-hidden />
      <div className="grid grid-cols-[1fr_64px] items-baseline gap-4 px-4 py-5 transition-colors group-hover:bg-bone-0/[0.02] md:grid-cols-[100px_100px_1fr_100px_40px] md:gap-5 md:px-5 md:py-5">
        <span className="mono-caption tabular text-bone-2 hidden md:inline">{date}</span>
        <span className={`mono-caption tabular hidden md:inline ${tone}`}>{verdict}</span>
        <div>
          <div className="font-serif text-[clamp(17px,1.9vw,22px)] leading-snug tracking-[-0.015em] text-bone-0">
            {r.ideaTitle || r.summary || "Untitled brief"}
          </div>
          <div className="mt-1 flex items-center gap-3 md:hidden">
            <span className="mono-caption tabular text-bone-2">{date}</span>
            <span className={`mono-caption tabular ${tone}`}>{verdict}</span>
            {score != null && (
              <span className="mono-caption tabular text-bone-1">{score}/100</span>
            )}
          </div>
        </div>
        <span className="tabular mono-caption hidden text-right text-bone-1 md:inline">
          {score != null ? `${score}/100` : "—"}
        </span>
        <span className="text-right">
          <span className="mono-caption text-bone-2 transition-all group-hover:translate-x-1 group-hover:text-bone-0">→</span>
        </span>
      </div>
    </li>
  )
}

function EmptyLedger() {
  return (
    <div className="py-16 text-center md:py-20">
      <p className="font-serif text-[clamp(20px,2.4vw,28px)] italic text-bone-1">
        {microcopy.empty.decisions}
      </p>
      <Link href="/dashboard/validate" className="tab-cta mt-8 inline-flex" data-cursor="file">
        <span>Begin</span>
        <span className="tab-cta-arrow">→</span>
      </Link>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = "auto"
  el.style.height = `${Math.min(el.scrollHeight, 240)}px`
}

function readFingerprint(): string | null {
  if (typeof window === "undefined") return null
  try {
    let fp = localStorage.getItem("fv_fingerprint")
    if (!fp) {
      fp = `fp_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
      localStorage.setItem("fv_fingerprint", fp)
    }
    return fp
  } catch {
    return null
  }
}

function getContextLine(memoCount: number, lastRecord?: DecisionRecord | null): string {
  if (memoCount === 0) return "Nothing on file yet. Start when the idea won\u2019t leave."

  // Check how long since last memo
  if (lastRecord) {
    const ms = recordTimeMs(lastRecord)
    if (ms > 0) {
      const daysSince = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24))
      if (daysSince > 7) return "Been a while. The archive hasn\u2019t moved \u2014 maybe you have."
    }
  }

  if (memoCount === 1) return "One memo on record. The second one is always sharper."
  return `${memoCount} memos on file. Open the latest, or start fresh.`
}
