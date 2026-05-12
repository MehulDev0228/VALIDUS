"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion, useInView, useSpring, useTransform } from "framer-motion"
import { ease } from "@/lib/motion"
import { memoResultHref } from "@/lib/founder-workflow/memo-links"
import type { DecisionRecord } from "@/lib/founder-workflow/types"

function recordTimeMs(r: DecisionRecord): number {
  const raw = r.timestamp || r.createdAt
  const ms = raw ? Date.parse(raw) : Number.NaN
  return Number.isFinite(ms) ? ms : 0
}

/** Animated number counter using spring physics */
function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    if (inView) spring.set(value)
  }, [inView, value, spring])

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v)
    })
    return unsubscribe
  }, [display])

  return <span ref={ref} className={className}>0</span>
}

export function FounderPulseCard({
  records,
}: {
  records: DecisionRecord[]
}) {
  const sorted = [...records].sort((a, b) => recordTimeMs(b) - recordTimeMs(a))
  const total = sorted.length
  const build = sorted.filter((r) => r.verdict === "BUILD").length
  const pivot = sorted.filter((r) => r.verdict === "PIVOT").length
  const kill = sorted.filter((r) => r.verdict === "KILL").length
  const latest = sorted[0]
  const daysSince =
    latest != null
      ? Math.max(
          0,
          Math.floor((Date.now() - recordTimeMs(latest)) / (24 * 60 * 60 * 1000)),
        )
      : null

  // Verdict distribution bar widths
  const barTotal = Math.max(1, build + pivot + kill)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: ease.editorial }}
      className="relative overflow-hidden rounded-lg border border-white/[0.09] bg-gradient-to-br from-ink-2/95 to-ink-0 shadow-[0_28px_80px_-52px_rgb(0_0_0/_0.75)]"
    >
      {/* Top gradient border — stronger, 2px */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-ember/50 to-transparent"
      />

      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ember/80">Founder pulse</p>
            <h2 className="mt-4 font-serif text-[clamp(26px,3.2vw,40px)] font-light leading-[1.12] tracking-[-0.03em] text-bone-0">
              {total === 0 ? "Your memo ledger is empty." : (
                <>
                  <CountUp value={total} className="tabular font-medium" /> memo{total === 1 ? "" : "s"} on file.
                </>
              )}
            </h2>
            {total > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <CountUp value={build} className="tabular text-[15px] font-medium text-verdict-build" />
                  <span className="text-[14px] text-bone-2">build</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CountUp value={pivot} className="tabular text-[15px] font-medium text-verdict-pivot" />
                  <span className="text-[14px] text-bone-2">pivot</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CountUp value={kill} className="tabular text-[15px] font-medium text-verdict-kill" />
                  <span className="text-[14px] text-bone-2">kill</span>
                </div>
                {daysSince !== null && (
                  <>
                    <span className="hidden text-bone-0/15 sm:inline">·</span>
                    <span className="text-[14px] text-bone-2">
                      last filed <span className="tabular text-bone-1">{daysSince === 0 ? "today" : `${daysSince}d ago`}</span>
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-4 max-w-[520px] text-[15px] text-bone-2">
                File a brief — the pulse fills as memos land.
              </p>
            )}

            {/* Verdict distribution bar */}
            {total > 0 && (
              <div className="mt-6 flex h-1.5 w-full max-w-[400px] overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full bg-verdict-build"
                  initial={{ width: 0 }}
                  animate={{ width: `${(build / barTotal) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.div
                  className="h-full bg-verdict-pivot"
                  initial={{ width: 0 }}
                  animate={{ width: `${(pivot / barTotal) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.div
                  className="h-full bg-verdict-kill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(kill / barTotal) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/validate"
              className="group inline-flex items-center gap-2 rounded-md bg-ember px-5 py-2.5 text-[13px] font-semibold text-ink-0 shadow-[0_8px_28px_-12px_rgb(6_182_212_/_0.45)] transition hover:bg-[#22d3ee] active:scale-[0.98]"
            >
              File new brief
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/dashboard/compare"
              className="inline-flex items-center gap-2 rounded-md border border-white/[0.1] px-5 py-2.5 text-[13px] font-medium text-bone-1 transition hover:border-white/[0.18] hover:text-bone-0"
            >
              Compare memos
            </Link>
            <Link
              href="/dashboard/founder"
              className="inline-flex items-center gap-2 rounded-md border border-white/[0.1] px-5 py-2.5 text-[13px] font-medium text-bone-1 transition hover:border-white/[0.18] hover:text-bone-0"
            >
              Founder workspace
            </Link>
          </div>
        </div>
      </div>

      {/* Latest memo — elevated card within card */}
      {latest && (
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-6 py-6 md:px-10">
          <div className="flex flex-wrap items-start gap-6 rounded-lg border border-white/[0.08] bg-ink-0/45 p-5 md:p-6">
            {/* Verdict accent bar */}
            <div className={`hidden w-1 self-stretch rounded-full sm:block ${
              latest.verdict === "BUILD"
                ? "bg-verdict-build"
                : latest.verdict === "KILL"
                  ? "bg-verdict-kill"
                  : "bg-verdict-pivot"
            }`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-bone-2">Latest memo</span>
                <span className={`text-[12px] font-semibold uppercase tracking-wider ${
                  latest.verdict === "BUILD"
                    ? "text-verdict-build"
                    : latest.verdict === "KILL"
                      ? "text-verdict-kill"
                      : "text-verdict-pivot"
                }`}>
                  {latest.verdict}
                </span>
                {typeof latest.opportunityScore === "number" && (
                  <span className="tabular text-[13px] text-bone-2">{latest.opportunityScore}/100</span>
                )}
              </div>
              <p className="mt-2 max-w-[640px] font-serif text-[17px] leading-snug text-bone-0">
                {(latest.ideaTitle || latest.title || "Untitled idea").slice(0, 140)}
              </p>
              <Link
                href={memoResultHref(latest)}
                className="mt-3 inline-block text-[12px] font-medium text-ember/80 transition hover:text-ember"
              >
                Open memo →
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  )
}
