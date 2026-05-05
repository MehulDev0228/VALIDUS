"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/dashboard-nav"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { readDecisionHistory } from "@/lib/founder-workflow/storage"
import type { DecisionRecord } from "@/lib/founder-workflow/types"

type Verdict = "BUILD" | "PIVOT" | "KILL"

/**
 * Ledger — the dashboard home.
 *
 * A forensic chronicle of every decision the user has filed. Each row is a
 * memo entry with verdict, score, date, and a deep-link back to the brief.
 * No charts, no widgets — just the record.
 */
export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [records, setRecords] = useState<DecisionRecord[]>([])
  const [serverRecords, setServerRecords] = useState<DecisionRecord[]>([])
  const [hydrated, setHydrated] = useState(false)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="grid h-[60vh] place-items-center">
          <span className="mono-caption tabular text-bone-2">opening ledger…</span>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />

      <main className="mx-auto max-w-[1200px] px-6 pt-16 pb-32 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="border-b border-bone-0/10 pb-10"
        >
          <p className="mono-caption">The ledger</p>
          <h1 className="mt-4 font-serif text-[clamp(40px,5vw,72px)] leading-[1.05] tracking-[-0.025em]">
            Every memo on file.
          </h1>
          <p className="mt-4 max-w-[560px] text-[16px] leading-[1.6] text-bone-1">
            A complete record of decisions you filed, what the system ruled, and where the falsification ended up. Nothing leaves the ledger.
          </p>
        </motion.header>

        {/* Totals strip */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: ease.editorial }}
          className="mt-12 grid grid-cols-3 gap-px border border-bone-0/10 bg-bone-0/10"
        >
          <Total label="filed" value={merged.length} />
          <Total label="builds" value={totals.BUILD} tone="build" />
          <Total label="kills" value={totals.KILL} tone="kill" />
        </motion.section>

        {/* Records */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: ease.editorial }}
          className="mt-20"
        >
          <header className="mb-6 flex items-end justify-between border-b border-bone-0/10 pb-6">
            <h2 className="font-serif text-[28px] leading-tight tracking-[-0.02em]">Recent verdicts</h2>
            <Link href="/dashboard/validate" className="tab-cta" data-cursor="file">
              <span>File a memo</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
          </header>

          {!hydrated ? (
            <div className="mono-caption tabular text-bone-2">loading…</div>
          ) : merged.length === 0 ? (
            <EmptyLedger />
          ) : (
            <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
              {merged.map((r, i) => (
                <RecordRow key={`${r.ideaId}-${r.timestamp}-${i}`} r={r} index={i} />
              ))}
            </ul>
          )}
        </motion.section>

        {user && (
          <p className="mono-caption mt-16 tabular text-bone-2">
            Session — {user.email || "anonymous"}
          </p>
        )}
      </main>
    </div>
  )
}

function Total({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "build" | "kill"
}) {
  const text = tone === "build" ? "text-verdict-build" : tone === "kill" ? "text-verdict-kill" : "text-bone-0"
  return (
    <div className="bg-ink-0 p-6 md:p-8">
      <div className="mono-caption">{label}</div>
      <div className={`tabular mt-3 font-sans text-[clamp(40px,4vw,56px)] font-medium leading-none tracking-[-0.03em] ${text}`}>
        {value.toString().padStart(2, "0")}
      </div>
    </div>
  )
}

function RecordRow({ r, index }: { r: DecisionRecord; index: number }) {
  const verdict = (r.verdict as Verdict) || "PIVOT"
  const tone =
    verdict === "BUILD" ? "text-verdict-build" : verdict === "KILL" ? "text-verdict-kill" : "text-verdict-pivot"
  const cursor = verdict === "BUILD" ? "approves" : verdict === "KILL" ? "denies" : "pivots"
  const date = new Date(r.timestamp).toISOString().slice(0, 10)
  const score = r.opportunityScore != null ? Math.round(r.opportunityScore) : null

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.04 * index, ease: ease.editorial }}
      data-cursor={cursor}
    >
      <div className="grid grid-cols-[80px_120px_1fr_120px_60px] items-baseline gap-6 py-6">
        <span className="mono-caption tabular text-bone-2">{date}</span>
        <span className={`font-sans text-[20px] font-semibold tracking-[-0.02em] ${tone}`}>{verdict}</span>
        <span className="text-[16px] leading-snug text-bone-0">
          {r.ideaTitle || r.summary || "Untitled brief"}
        </span>
        <span className="tabular mono-caption text-right text-bone-1">
          {score != null ? `${score}/100` : "—"}
        </span>
        <span className="text-right">
          <span className="mono-caption text-bone-2 transition-colors hover:text-bone-0">→</span>
        </span>
      </div>
      {r.summary && r.summary !== r.ideaTitle && (
        <p className="mb-6 ml-[200px] max-w-[640px] text-[14px] leading-snug text-bone-1">
          {r.summary}
        </p>
      )}
    </motion.li>
  )
}

function EmptyLedger() {
  return (
    <div className="grid gap-8 border border-bone-0/10 bg-ink-1 p-10 md:grid-cols-[1fr_auto] md:items-center">
      <div className="max-w-[480px]">
        <p className="mono-caption mb-3">Empty ledger</p>
        <p className="font-serif text-[28px] leading-snug tracking-[-0.02em]">
          {microcopy.empty.decisions}
        </p>
      </div>
      <Link href="/dashboard/validate" className="tab-cta" data-cursor="file">
        <span>File the first memo</span>
        <span className="tab-cta-arrow">→</span>
      </Link>
    </div>
  )
}
