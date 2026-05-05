"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/dashboard-nav"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { readDecisionHistory } from "@/lib/founder-workflow/storage"
import type { DecisionRecord } from "@/lib/founder-workflow/types"

type Verdict = "BUILD" | "PIVOT" | "KILL"

const AGENTS = [
  { code: "MR", name: "Market Research", tone: "neutral" as const },
  { code: "CO", name: "Competitor", tone: "kill" as const },
  { code: "MN", name: "Monetization", tone: "build" as const },
  { code: "FE", name: "Feasibility", tone: "neutral" as const },
  { code: "IC", name: "ICP", tone: "pivot" as const },
  { code: "RF", name: "Risk & Failure", tone: "kill" as const },
  { code: "VS", name: "Validation", tone: "build" as const },
  { code: "FJ", name: "Final Judge", tone: "neutral" as const },
]

const toneClass = (tone: "build" | "pivot" | "kill" | "neutral") =>
  tone === "build"
    ? "bg-verdict-build"
    : tone === "kill"
      ? "bg-verdict-kill"
      : tone === "pivot"
        ? "bg-verdict-pivot"
        : "bg-bone-0"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [records, setRecords] = useState<DecisionRecord[]>([])
  const [serverRecords, setServerRecords] = useState<DecisionRecord[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; resetInSeconds: number } | null>(null)
  const [draft, setDraft] = useState("")

  // Auth gate
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/dashboard")
    }
  }, [user, loading, router])

  useEffect(() => {
    setRecords(readDecisionHistory())
    setHydrated(true)

    fetch("/api/decision-history")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.records)) setServerRecords(j.records as DecisionRecord[])
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
      const key = `${r.ideaId}::${r.timestamp}`
      if (!byKey.has(key)) byKey.set(key, r)
    }
    return Array.from(byKey.values()).sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
  }, [records, serverRecords])

  const totals = useMemo(() => {
    const t = { BUILD: 0, PIVOT: 0, KILL: 0 } as Record<Verdict, number>
    merged.forEach((r) => {
      const v = (r.verdict as Verdict) || "PIVOT"
      if (t[v] != null) t[v] += 1
    })
    return t
  }, [merged])

  const stats = useMemo(() => {
    const now = Date.now()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    const lastSeven = merged.filter((r) => now - new Date(r.timestamp).getTime() < SEVEN_DAYS)
    const scores = merged
      .map((r) => (r.opportunityScore != null ? Math.round(r.opportunityScore) : null))
      .filter((s): s is number => s != null)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    const last = merged[0]
    return {
      week: lastSeven.length,
      avgScore,
      lastVerdict: (last?.verdict as Verdict) || null,
      lastDate: last?.timestamp ?? null,
    }
  }, [merged])

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="grid h-[60vh] place-items-center">
          <span className="mono-caption tabular text-bone-2">opening ledger…</span>
        </main>
      </div>
    )
  }

  const used = usage?.used ?? 0
  const limit = usage?.limit ?? 2
  const remaining = Math.max(0, limit - used)
  const limitReached = remaining === 0
  const greeting = greetingFor(user)

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />

      <main className="mx-auto max-w-[1440px] px-6 pb-32 pt-12 md:px-10">
        {/* COMMAND STRIP — usage meter + greeting */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="grid grid-cols-1 gap-8 border-b border-bone-0/[0.08] pb-12 md:grid-cols-12 md:gap-10 md:pb-16"
        >
          <div className="md:col-span-7">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-bone-0 opacity-60" />
                <span className="relative inline-flex h-2 w-2 bg-bone-0" />
              </span>
              <span className="mono-caption tabular text-bone-1">
                LEDGER OPEN · {new Date().toUTCString().slice(17, 25)} UTC
              </span>
            </div>

            <h1 className="mt-6 font-serif text-[clamp(40px,5.5vw,84px)] leading-[1.0] tracking-[-0.03em]">
              {greeting},
              <br />
              <em className="font-serif italic text-bone-1">
                {nameFor(user)}.
              </em>
            </h1>

            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.55] text-bone-1">
              {merged.length === 0
                ? "Empty docket. The first memo opens the file. Two memos a day, always."
                : `${merged.length} memo${merged.length === 1 ? "" : "s"} on file. The system is ready for the next one.`}
            </p>
          </div>

          <div className="md:col-span-5">
            <UsageMeter used={used} limit={limit} resetInSeconds={usage?.resetInSeconds ?? 0} />
          </div>
        </motion.section>

        {/* QUICK BRIEF — inline file input on dashboard */}
        <QuickBrief
          value={draft}
          onChange={setDraft}
          onSubmit={handleQuickFile}
          disabled={limitReached}
          remaining={remaining}
          limit={limit}
        />

        {/* AGENT BENCH — live ready strip */}
        <AgentBench />

        {/* PACE BLOCK */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.55, ease: ease.editorial }}
          className="mt-20 grid grid-cols-2 gap-px border border-bone-0/[0.08] bg-bone-0/[0.08] md:grid-cols-4"
        >
          <PaceTile label="Filed total" value={merged.length.toString().padStart(2, "0")} />
          <PaceTile label="This week" value={stats.week.toString().padStart(2, "0")} />
          <PaceTile
            label="Avg score"
            value={stats.avgScore != null ? `${stats.avgScore}` : "—"}
            sub={stats.avgScore != null ? "/100" : undefined}
          />
          <PaceTile
            label="Last verdict"
            value={stats.lastVerdict ?? "—"}
            tone={
              stats.lastVerdict === "BUILD"
                ? "build"
                : stats.lastVerdict === "KILL"
                  ? "kill"
                  : stats.lastVerdict === "PIVOT"
                    ? "pivot"
                    : "neutral"
            }
          />
        </motion.section>

        {/* LEDGER */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="mt-24"
        >
          <header className="mb-6 flex items-end justify-between border-b border-bone-0/[0.08] pb-6">
            <div>
              <p className="mono-caption">The ledger</p>
              <h2 className="mt-2 font-serif text-[clamp(28px,3.4vw,40px)] leading-tight tracking-[-0.02em]">
                Recent verdicts
              </h2>
            </div>
            <Link href="/dashboard/validate" className="tab-cta" data-cursor="file">
              <span className="hidden sm:inline">File a memo</span>
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
                <RecordRow key={`${r.ideaId}-${r.timestamp}-${i}`} r={r} index={i} />
              ))}
            </ul>
          )}

          {merged.length > 12 && (
            <p className="mono-caption mt-6 tabular text-bone-2">
              {merged.length - 12} older memos archived. Scroll deeper to retrieve.
            </p>
          )}
        </motion.section>

        <p className="mono-caption mt-20 tabular text-bone-2">
          Session — {user.email || "anonymous"} · ID {user.id.slice(0, 12)}…
        </p>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function UsageMeter({
  used,
  limit,
  resetInSeconds,
}: {
  used: number
  limit: number
  resetInSeconds: number
}) {
  const remaining = Math.max(0, limit - used)
  const tone = remaining === 0 ? "kill" : remaining === limit ? "build" : "pivot"
  const toneText =
    tone === "kill" ? "text-verdict-kill" : tone === "build" ? "text-verdict-build" : "text-verdict-pivot"

  return (
    <div className="border border-bone-0/[0.08] p-6 md:p-8" data-cursor="watching">
      <div className="flex items-baseline justify-between">
        <p className="mono-caption">Today's docket</p>
        <p className="mono-caption tabular text-bone-2">UTC</p>
      </div>

      <div className="mt-4 flex items-baseline gap-4">
        <div className={`tabular font-sans text-[clamp(56px,8vw,96px)] font-medium leading-none tracking-[-0.04em] ${toneText}`}>
          {used}
        </div>
        <div className="font-serif text-[28px] italic text-bone-2">/ {limit}</div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {Array.from({ length: limit }).map((_, i) => {
          const filled = i < used
          return (
            <div
              key={i}
              className={`h-3 ${filled ? "bg-bone-0" : "border border-bone-0/15 bg-transparent"}`}
              aria-hidden
            />
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-bone-0/[0.06] pt-4">
        <p className="text-[13px] leading-snug text-bone-1">
          {remaining === 0
            ? "Limit reached. The judges sleep."
            : remaining === limit
              ? "Two slots open. Use them sharper than yesterday."
              : `${remaining} slot left today.`}
        </p>
        <p className="mono-caption tabular text-bone-2">
          resets in <ResetCountdown seconds={resetInSeconds} />
        </p>
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
  const ss = s % 60
  return (
    <span className="tabular">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </span>
  )
}

function QuickBrief({
  value,
  onChange,
  onSubmit,
  disabled,
  remaining,
  limit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
  remaining: number
  limit: number
}) {
  function autosize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.55, ease: ease.editorial }}
      className="mt-12 border-b border-bone-0/[0.08] pb-12 md:mt-16 md:pb-16"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-3">
          <p className="mono-caption">Quick brief</p>
          <p className="mt-3 max-w-[280px] text-[14px] leading-snug text-bone-1">
            Type a one-line idea. The system carries you to the full intake with this on top.
          </p>
        </div>

        <div className="md:col-span-9">
          <div className="border border-bone-0/[0.08] bg-ink-1/40 p-5 md:p-6" data-cursor="input">
            <textarea
              rows={1}
              value={value}
              disabled={disabled}
              onChange={(e) => {
                onChange(e.target.value)
                autosize(e.currentTarget)
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit()
              }}
              placeholder={disabled ? "Limit reached. The judges sleep." : "An AI tool for boutique law firms…"}
              className="w-full resize-none border-0 bg-transparent font-serif text-[clamp(20px,2.4vw,32px)] leading-[1.2] tracking-[-0.015em] text-bone-0 placeholder:text-bone-2/70 focus:outline-none disabled:opacity-50"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-bone-0/[0.06] pt-4">
              <span className="mono-caption tabular text-bone-2">
                {value.length > 0 ? `${value.length} chars` : "0 chars"} · ⌘⏎ to file
              </span>
              <button
                type="button"
                onClick={onSubmit}
                disabled={disabled || value.trim().length < 8}
                className={`tab-cta ${disabled || value.trim().length < 8 ? "pointer-events-none opacity-40" : ""}`}
              >
                <span>Carry to intake</span>
                <span className="tab-cta-arrow">→</span>
              </button>
            </div>
          </div>
          <p className="mono-caption mt-3 text-bone-2">
            {remaining}/{limit} slots remain today.
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function AgentBench() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, margin: "-15%" })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, ease: ease.editorial }}
      className="mt-12 md:mt-16"
    >
      <header className="mb-4 flex items-baseline justify-between">
        <p className="mono-caption">The bench — standing by</p>
        <p className="mono-caption tabular text-bone-2">8 / 8 ready</p>
      </header>
      <div className="grid grid-cols-4 gap-px border border-bone-0/[0.08] bg-bone-0/[0.08] md:grid-cols-8">
        {AGENTS.map((a, i) => (
          <motion.div
            key={a.code}
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.04 * i, ease: ease.editorial }}
            className="group relative bg-ink-0 p-4 transition-colors duration-300 hover:bg-ink-1"
            data-cursor="dossier"
          >
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 ${toneClass(a.tone)} animate-pulse`} aria-hidden />
              <span className="mono-caption tabular text-bone-2">{a.code}</span>
            </div>
            <div className="mt-3 font-serif text-[15px] leading-tight tracking-[-0.01em] text-bone-0">
              {a.name}
            </div>
            <div className="mt-2 mono-caption text-bone-2 transition-colors group-hover:text-bone-1">
              READY
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

function PaceTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: "build" | "pivot" | "kill" | "neutral"
}) {
  const text =
    tone === "build"
      ? "text-verdict-build"
      : tone === "kill"
        ? "text-verdict-kill"
        : tone === "pivot"
          ? "text-verdict-pivot"
          : "text-bone-0"
  return (
    <div className="bg-ink-0 p-6 md:p-8">
      <div className="mono-caption">{label}</div>
      <div className={`tabular mt-3 flex items-baseline font-sans text-[clamp(36px,4vw,52px)] font-medium leading-none tracking-[-0.03em] ${text}`}>
        <span>{value}</span>
        {sub && <span className="ml-1 font-serif text-[18px] italic text-bone-2">{sub}</span>}
      </div>
    </div>
  )
}

function RecordRow({ r, index }: { r: DecisionRecord; index: number }) {
  const verdict = (r.verdict as Verdict) || "PIVOT"
  const tone =
    verdict === "BUILD" ? "text-verdict-build" : verdict === "KILL" ? "text-verdict-kill" : "text-verdict-pivot"
  const accent =
    verdict === "BUILD" ? "bg-verdict-build" : verdict === "KILL" ? "bg-verdict-kill" : "bg-verdict-pivot"
  const cursor = verdict === "BUILD" ? "approves" : verdict === "KILL" ? "denies" : "pivots"
  const date = new Date(r.timestamp).toISOString().slice(0, 10)
  const score = r.opportunityScore != null ? Math.round(r.opportunityScore) : null

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.03 * index, ease: ease.editorial }}
      data-cursor={cursor}
      className="group relative border-b border-bone-0/[0.08] last:border-b-0"
    >
      <div className={`absolute left-0 top-0 h-full w-px ${accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} aria-hidden />
      <div className="grid grid-cols-[1fr_64px] items-baseline gap-4 px-4 py-5 transition-colors group-hover:bg-bone-0/[0.02] md:grid-cols-[100px_120px_1fr_120px_64px] md:gap-6 md:px-6 md:py-6">
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
      {r.summary && r.summary !== r.ideaTitle && (
        <p className="hidden ml-[124px] max-w-[640px] pb-5 pl-6 text-[14px] leading-snug text-bone-1 md:block">
          {r.summary}
        </p>
      )}
    </motion.li>
  )
}

function EmptyLedger() {
  return (
    <div className="grid gap-8 border border-bone-0/[0.1] bg-ink-1/40 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
      <div className="max-w-[520px]">
        <p className="mono-caption mb-3">Empty docket</p>
        <p className="font-serif text-[clamp(22px,2.6vw,32px)] leading-snug tracking-[-0.02em]">
          {microcopy.empty.decisions}
        </p>
        <p className="mt-4 text-[14px] leading-snug text-bone-1">
          File the first one — the system has been waiting.
        </p>
      </div>
      <Link href="/dashboard/validate" className="tab-cta" data-cursor="file">
        <span>File the first memo</span>
        <span className="tab-cta-arrow">→</span>
      </Link>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

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

function nameFor(user: { name?: string | null; email?: string | null; user_metadata?: { full_name?: string | null } } | null) {
  if (!user) return "founder"
  return (
    user.name ||
    user.user_metadata?.full_name ||
    (user.email ? user.email.split("@")[0] : null) ||
    "founder"
  )
}

function greetingFor(_user: unknown) {
  const h = new Date().getHours()
  if (h < 5) return "Up late"
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  if (h < 22) return "Good evening"
  return "Working late"
}
