"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardOperatingSpine } from "@/components/dashboard-operating-spine"
import { ThoughtStream } from "@/components/thought-stream"
import { ActiveTensions } from "@/components/active-tensions"
import { IdeaGraveyard } from "@/components/idea-graveyard"
import { MemoArchiveSearch } from "@/components/memo-archive-search"
import { FounderPulseCard } from "@/components/founder-pulse-card"
import { DashboardWorkspaceTools } from "@/components/dashboard-workspace-tools"
import { ChamberLink } from "@/components/chamber"
import { AnimatedStat } from "@/components/marketing/animated-stat"
import { Skeleton } from "@/components/ui/skeleton"
import { ease } from "@/lib/motion"
import { toastDraftContinued } from "@/lib/verdict-toast"
import { deriveActiveTensions, whereYouLeftOff } from "@/lib/cognition"
import type { ProgressionWorkspacePayload } from "@/lib/founder-memory/bundle"
import type { ExecutionWorkspacePayload } from "@/lib/founder-memory/execution-workspace"
import type { BlindSpotObservation } from "@/lib/founder-memory/types"
import type { DecisionRecord } from "@/lib/founder-workflow/types"
import { microcopy } from "@/lib/microcopy"
import { cn } from "@/lib/utils"

function recordTimeMs(r: DecisionRecord): number {
  const raw = r.timestamp || r.createdAt
  const ms = raw ? Date.parse(raw) : Number.NaN
  return Number.isFinite(ms) ? ms : 0
}

/** Signed-in home: quick draft box, tensions, memo list, continuity. */
export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [records, setRecords] = useState<DecisionRecord[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; resetInSeconds: number } | null>(null)
  const [draft, setDraft] = useState("")
  const [draftPlaceholderIdx, setDraftPlaceholderIdx] = useState(0)
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
          setFm({ journeyLines: [], execution: null, progression: null, blindSpots: [] })
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
          setFm({ journeyLines: [], execution: null, progression: null, blindSpots: [] })
          setFmBusy(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, router])

  useEffect(() => {
    if (!user) return
    setHydrated(true)
    fetch("/api/decision-history", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const rows = Array.isArray(j?.decisions) ? j.decisions : []
        const mapped: DecisionRecord[] = rows.map(
          (d: {
            id: string
            ideaId: string
            ideaTitle?: string
            verdict: DecisionRecord["verdict"]
            opportunityScore?: number
            summary?: string
            timestamp: string
            runId?: string
          }) => ({
            id: d.id,
            ideaId: d.ideaId,
            runId: d.runId,
            ideaTitle: d.ideaTitle,
            title: d.ideaTitle,
            verdict: d.verdict,
            opportunityScore: d.opportunityScore,
            summary: d.summary,
            timestamp: d.timestamp,
            createdAt: d.timestamp,
          }),
        )
        setRecords(mapped)
      })
      .catch(() => {})
  }, [user])

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
    return [...records].sort((a, b) => recordTimeMs(b) - recordTimeMs(a))
  }, [records])

  const livingStream = useMemo(() => merged.filter((r) => r.verdict !== "KILL"), [merged])

  const draftPlaceholders = useMemo(
    () => [
      "What if there was a way to…",
      "I keep thinking about…",
      "The problem with X is…",
      "Buyers keep telling me…",
    ],
    [],
  )

  useEffect(() => {
    if (draft.trim().length > 0) return
    if (usage != null && usage.used >= usage.limit) return
    const id = window.setInterval(() => {
      setDraftPlaceholderIdx((i) => (i + 1) % draftPlaceholders.length)
    }, 3000)
    return () => clearInterval(id)
  }, [draft, usage, draftPlaceholders.length])
  const tensions = useMemo(() => deriveActiveTensions(merged), [merged])
  const contextLine = useMemo(() => whereYouLeftOff(merged), [merged])

  function handleQuickFile() {
    if (!draft.trim() || draft.trim().length < 8) return
    try {
      const payload = { title: draft.slice(0, 80).trim(), description: draft.trim() }
      localStorage.setItem("fv_prefill_validate", JSON.stringify(payload))
    } catch {}
    // Fire the chamber curtain manually since this is a programmatic nav,
    // not a ChamberLink. Hold ~480ms so the dim lands before the route swap.
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (!reduced) {
        window.dispatchEvent(new CustomEvent("chamber:enter"))
        setTimeout(() => router.push("/dashboard/validate"), 480)
        toastDraftContinued()
        return
      }
    }
    toastDraftContinued()
    router.push("/dashboard/validate")
  }

  if (loading || !user || fmBusy || fm === null) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="mx-auto max-w-[1080px] px-6 pb-32 pt-12 md:px-12 md:pt-20">
          <div className="space-y-10">
            <div className="space-y-4">
              <Skeleton className="h-3 w-24 rounded-sm bg-bone-0/[0.07]" />
              <Skeleton className="h-12 w-full max-w-[560px] rounded-sm bg-bone-0/[0.06]" />
              <Skeleton className="h-3 w-40 rounded-sm bg-bone-0/[0.05]" />
            </div>
            <Skeleton className="h-[220px] w-full rounded-sm bg-bone-0/[0.05]" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-24 rounded-sm bg-bone-0/[0.05]" />
              <Skeleton className="h-24 rounded-sm bg-bone-0/[0.05]" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const used = usage?.used ?? 0
  const limit = usage?.limit ?? 2
  const remaining = Math.max(0, limit - used)
  const limitReached = remaining === 0

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />
      <DashboardWorkspaceTools />

      <main className="mx-auto max-w-[1080px] px-6 pb-32 pt-12 md:px-12 md:pt-20">
        <div className="mb-14 md:mb-16">
          <FounderPulseCard records={merged} />
        </div>

        {/* ----- Where your thinking left off ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: ease.editorial }}
          className="max-w-[700px]"
        >
          <p className="mono-caption text-ember/80">{microcopy.dashboard.statusEyebrow}</p>
          <h1 className="mt-5 font-serif text-[clamp(28px,3.6vw,46px)] font-light leading-[1.15] tracking-[-0.025em] text-bone-0">
            {contextLine}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-bone-2">
            <span className="mono-caption tabular">
              {microcopy.validate.counter(used, limit)}
            </span>
            <UsageSegments used={used} limit={limit} />
            {limitReached && usage?.resetInSeconds ? (
              <>
                <span className="h-px w-4 bg-bone-0/[0.1]" />
                <span className="mono-caption tabular">
                  resets in <ResetCountdown seconds={usage.resetInSeconds} />
                </span>
              </>
            ) : null}
          </div>
        </motion.section>

        {/* ----- Writing chamber ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: ease.editorial }}
          className="mt-14 md:mt-20"
        >
          <div className="chamber rounded-sm p-8 md:p-12">
            <p className="mono-caption text-bone-2">{microcopy.dashboard.quickBriefEyebrow}</p>
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
                  ? microcopy.dashboard.quickBriefPlaceholderDisabled
                  : draftPlaceholders[draftPlaceholderIdx]
              }
              className="mt-6 w-full resize-none border-0 border-b border-transparent bg-transparent pb-2 font-serif text-[clamp(22px,2.8vw,36px)] font-light leading-[1.25] tracking-[-0.02em] text-bone-0 placeholder:text-bone-2/40 transition-[border-color,box-shadow] focus:border-ember/35 focus:outline-none focus:shadow-[0_12px_36px_-18px_rgb(6_182_212_/_0.35)] disabled:opacity-40"
              autoFocus
            />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-bone-0/[0.08] pt-5">
              <motion.span
                initial={false}
                animate={{ opacity: draft.length > 0 ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="mono-caption tabular text-bone-2 inline-flex flex-wrap items-baseline gap-x-1.5"
              >
                <span className="inline-flex items-baseline gap-1">
                  <AnimatedStat value={draft.length} className="tabular text-bone-2" />
                  <span>chars</span>
                </span>
                <span className="text-bone-2/60">· ⌘⏎ when ready</span>
              </motion.span>
              <motion.button
                type="button"
                onClick={handleQuickFile}
                disabled={limitReached || draft.trim().length < 8}
                initial={{ opacity: 0 }}
                animate={{ opacity: draft.trim().length >= 8 ? 1 : 0 }}
                transition={{ duration: 0.4, ease: ease.editorial }}
                className={`tab-cta ${limitReached || draft.trim().length < 8 ? "pointer-events-none" : ""}`}
              >
                <span>{microcopy.validate.submit}</span>
                <span className="tab-cta-arrow">→</span>
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* ----- Active Tensions ----- */}
        {tensions.length > 0 && (
          <div className="mt-24 md:mt-32">
            <ActiveTensions tensions={tensions} />
          </div>
        )}

        {/* ----- Thought Stream ----- */}
        <section className="mt-24 md:mt-32">
          <VerdictDistributionStrip records={merged} />
          <header className="mb-10 flex items-end justify-between border-b border-bone-0/[0.08] pb-6">
            <div>
              <p className="mono-caption text-bone-2">{microcopy.dashboard.ledgerEyebrow}</p>
              <h2 className="mt-3 font-serif text-[clamp(28px,3.4vw,44px)] font-light leading-[1.1] tracking-[-0.025em] text-bone-0">
                {microcopy.dashboard.ledgerTitle}{" "}
                <span className="whitespace-nowrap text-bone-2/90 tabular">({livingStream.length})</span>
              </h2>
            </div>
            <ChamberLink href="/dashboard/validate" className="tab-cta hidden md:inline-flex">
              <span>{microcopy.dashboard.nav.memo}</span>
              <span className="tab-cta-arrow">→</span>
            </ChamberLink>
          </header>

          {!hydrated ? (
            <p className="mono-caption tabular text-bone-2">{microcopy.dashboard.loading}</p>
          ) : livingStream.length === 0 ? (
            <EmptyStream />
          ) : (
            <ThoughtStream records={livingStream.slice(0, 12)} />
          )}

          {livingStream.length > 12 && (
            <p className="mono-caption mt-8 tabular text-bone-2">
              {livingStream.length - 12} more on record
            </p>
          )}

          <div className="mt-16">
            <MemoArchiveSearch />
          </div>
        </section>

        {/* ----- Idea Graveyard ----- */}
        <div className="mt-24 md:mt-32">
          <IdeaGraveyard records={merged} />
        </div>

        {/* ----- Continuity Spine ----- */}
        {(fm.journeyLines.length > 0 || fm.execution || fm.progression || fm.blindSpots.length > 0) && (
          <section className="mt-24 md:mt-32 border-t border-bone-0/[0.08] pt-12 md:pt-16">
            <p className="mono-caption mb-3 text-bone-2">{microcopy.dashboard.spine.eyebrow}</p>
            <DashboardOperatingSpine
              journeyLines={fm.journeyLines}
              execution={fm.execution}
              progression={fm.progression}
              blindSpots={fm.blindSpots}
            />
          </section>
        )}
      </main>

      <KeyboardShortcutsHint />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function UsageSegments({ used, limit }: { used: number; limit: number }) {
  return (
    <div className="flex items-center gap-1.5 border-l border-bone-0/[0.08] pl-4" aria-hidden>
      <span className="mono-caption sr-only">{used} of {limit} runs used</span>
      <div className="flex gap-0.5">
        {Array.from({ length: limit }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-8 rounded-[1px]",
              i < used ? "bg-bone-0" : "bg-bone-0/12",
            )}
          />
        ))}
      </div>
    </div>
  )
}

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

function VerdictDistributionStrip({ records }: { records: DecisionRecord[] }) {
  const build = records.filter((r) => r.verdict === "BUILD").length
  const pivot = records.filter((r) => r.verdict === "PIVOT").length
  const kill = records.filter((r) => r.verdict === "KILL").length
  const total = Math.max(1, build + pivot + kill)
  if (records.length === 0) return null
  return (
    <div className="mb-10 rounded-sm border border-bone-0/[0.08] bg-bone-0/[0.02] px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="mono-caption text-bone-2">Verdict mix</span>
        <span className="mono-caption tabular text-bone-2">
          {build} build · {pivot} pivot · {kill} kill
        </span>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full bg-verdict-build"
          initial={{ width: 0 }}
          animate={{ width: `${(build / total) * 100}%` }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="h-full bg-verdict-pivot"
          initial={{ width: 0 }}
          animate={{ width: `${(pivot / total) * 100}%` }}
          transition={{ duration: 0.75, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="h-full bg-verdict-kill"
          initial={{ width: 0 }}
          animate={{ width: `${(kill / total) * 100}%` }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

function KeyboardShortcutsHint() {
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem("fv_dash_kb_seen")) {
        setPulse(true)
        localStorage.setItem("fv_dash_kb_seen", "1")
      }
    } catch {}
  }, [])
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40">
      <button
        type="button"
        title="⌘⏎ files your brief · Esc closes overlays where supported"
        onClick={() => setPulse(false)}
        className={cn(
          "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-bone-0/15 bg-ink-1/95 text-[14px] font-medium text-bone-2 shadow-[0_12px_40px_-24px_rgb(0_0_0/_0.55)] backdrop-blur-md transition hover:border-bone-0/25 hover:text-bone-0",
          pulse && "animate-pulse",
        )}
      >
        ?
      </button>
    </div>
  )
}

function EmptyStream() {
  return (
    <div className="py-20 text-center md:py-28">
      <div className="flex justify-center">
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember/35 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ember/90 shadow-[0_0_18px_rgb(6_182_212_/_0.45)]" />
        </span>
      </div>
      <p className="mt-10 font-serif text-[clamp(22px,2.6vw,32px)] font-light italic leading-[1.3] tracking-[-0.015em] text-bone-1">
        The room is quiet.<br />
        File the first thought when the idea won't leave.
      </p>
      <ChamberLink href="/dashboard/validate" className="tab-cta mt-12 inline-flex">
        <span>start writing</span>
        <span className="tab-cta-arrow">→</span>
      </ChamberLink>
    </div>
  )
}

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = "auto"
  el.style.height = `${Math.min(el.scrollHeight, 280)}px`
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
