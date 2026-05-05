"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

const AGENTS = [
  { tag: "MKT", name: "Market Research", line: "Tier-2 willingness-to-pay is thin. Pricing assumption flagged." },
  { tag: "CMP", name: "Competitor", line: "Three incumbents already ship 70% of the wedge — for free." },
  { tag: "MON", name: "Monetization", line: "Buyer is the engineer. Engineers don't have budget." },
  { tag: "FBL", name: "Feasibility", line: "Integration surface is bigger than the wedge. Risk: 9 months to demo." },
  { tag: "ICP", name: "ICP", line: "Status incentive is weak. No-one shares this with their team." },
  { tag: "RSK", name: "Risk & Failure", line: "If GitHub adds this in Q3, the company is dead in a quarter." },
  { tag: "VAL", name: "Validation", line: "48h test: 12 paid pilots or kill it. No moral victories." },
]

/**
 * LoadingTheatre — full-screen 4-phase reveal.
 *
 * Phases (timing in seconds, total ~28s but resolves the moment the parent
 * tells us we're done):
 *   1. Decoding   (0 → 4)
 *   2. Researching (4 → 10)
 *   3. Debating   (10 → 22)  agents drop in one-by-one
 *   4. Ruling     (22 → end) verdict is composed letter-by-letter
 */
export function LoadingTheatre({
  onCancel,
  finished,
  verdictHint = "BUILD",
}: {
  onCancel?: () => void
  finished?: boolean
  verdictHint?: "BUILD" | "PIVOT" | "KILL"
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0) // 0..3
  const [revealed, setRevealed] = useState(0) // # agents revealed

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800)
    const t2 = setTimeout(() => setPhase(2), 4400)
    const t3 = setTimeout(() => setPhase(3), 14000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  useEffect(() => {
    if (phase !== 2) return
    let i = 0
    const id = setInterval(() => {
      i += 1
      setRevealed(i)
      if (i >= AGENTS.length) clearInterval(id)
    }, 950)
    return () => clearInterval(id)
  }, [phase])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-0 text-bone-0">
      {/* Top status bar */}
      <header className="flex h-16 items-center justify-between border-b border-bone-0/10 px-6 md:px-10">
        <div className="flex items-center gap-3">
          <span className="relative h-2 w-2">
            <motion.span
              className="absolute inset-0 bg-bone-0"
              animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          <span className="mono-caption tabular text-bone-0">
            {String(phase + 1).padStart(2, "0")} / 04 — {microcopy.loading.phases[phase].label}
          </span>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mono-caption text-bone-2 transition-colors hover:text-bone-0"
          >
            {microcopy.loading.cancel} ↵
          </button>
        )}
      </header>

      {/* Phase progress rail */}
      <div className="grid grid-cols-4 border-b border-bone-0/10">
        {microcopy.loading.phases.map((p, i) => (
          <div
            key={p.label}
            className={`px-6 py-3 text-left ${
              i <= phase ? "bg-bone-0/[0.02]" : "bg-transparent"
            }`}
          >
            <div className="mono-caption tabular">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className={`mt-1 text-[13px] ${
                i === phase ? "text-bone-0" : "text-bone-2"
              }`}
            >
              {p.label}
            </div>
            <div className="mt-3 h-px bg-bone-0/10">
              {i <= phase && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: i < phase ? "100%" : "62%" }}
                  transition={{ duration: i < phase ? 0.6 : 6, ease: ease.editorial }}
                  className="h-px bg-bone-0"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main stage */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.section
              key="decode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid h-full place-items-center px-6"
            >
              <div className="max-w-[640px] text-center">
                <p className="mono-caption mb-6">phase 01 — decode</p>
                <p className="font-serif text-[clamp(28px,4vw,48px)] leading-snug">
                  {microcopy.loading.phases[0].line}
                </p>
              </div>
            </motion.section>
          )}

          {phase === 1 && (
            <motion.section
              key="research"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto grid h-full max-w-[1040px] grid-cols-12 items-center gap-6 px-6"
            >
              <div className="col-span-12 md:col-span-5">
                <p className="mono-caption mb-6">phase 02 — research</p>
                <p className="font-serif text-[clamp(28px,3.4vw,40px)] leading-snug">
                  {microcopy.loading.phases[1].line}
                </p>
              </div>
              <div className="col-span-12 md:col-span-7">
                <ResearchStream />
              </div>
            </motion.section>
          )}

          {phase === 2 && (
            <motion.section
              key="debate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto h-full max-w-[1040px] px-6 py-12"
            >
              <p className="mono-caption mb-6">phase 03 — debate</p>
              <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
                {AGENTS.slice(0, revealed).map((a) => (
                  <motion.li
                    key={a.tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: ease.editorial }}
                    className="grid grid-cols-[64px_140px_1fr] items-baseline gap-6 py-4"
                  >
                    <span className="mono-caption tabular">{a.tag}</span>
                    <span className="text-[14px] text-bone-0">{a.name}</span>
                    <span className="text-[15px] leading-snug text-bone-1">
                      {a.line}
                    </span>
                  </motion.li>
                ))}
              </ul>
              <p className="mono-caption mt-8 text-bone-2">
                {revealed} of 7 on record
              </p>
            </motion.section>
          )}

          {phase === 3 && (
            <motion.section
              key="rule"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid h-full place-items-center px-6"
            >
              <div className="text-center">
                <p className="mono-caption mb-6">phase 04 — rule</p>
                <VerdictReveal text={verdictHint} />
                <p className="mt-8 font-serif text-[20px] italic text-bone-1">
                  {microcopy.loading.phases[3].line}
                </p>
                {finished && (
                  <p className="mono-caption mt-10 text-bone-2">
                    Composing memo…
                  </p>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ResearchStream() {
  const [lines, setLines] = useState<string[]>([])
  const all = [
    "querying competitor index — 18 hits",
    "country profile: US / segment: SMB engineering",
    "willingness-to-pay distribution: bimodal",
    "incumbent overlap: 0.71 — high",
    "category CAC trend: rising 12% YoY",
    "search demand: stable, low intent",
    "buyer budget owner: VP Engineering",
    "switching cost vs. status quo: 2.1x",
  ]
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setLines((prev) => [...prev, all[i % all.length]])
      i += 1
      if (i >= all.length) clearInterval(id)
    }, 540)
    return () => clearInterval(id)
  }, [])
  return (
    <ul className="space-y-2 font-mono text-[12px] uppercase tracking-[0.06em] text-bone-1">
      {lines.map((l, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: ease.editorial }}
          className="flex gap-3"
        >
          <span className="tabular text-bone-2">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{l}</span>
        </motion.li>
      ))}
    </ul>
  )
}

function VerdictReveal({ text }: { text: string }) {
  const tone =
    text === "BUILD"
      ? "text-verdict-build"
      : text === "PIVOT"
      ? "text-verdict-pivot"
      : "text-verdict-kill"
  return (
    <div
      className={`font-sans text-[clamp(80px,12vw,180px)] font-semibold leading-none tracking-[-0.04em] ${tone}`}
      aria-live="polite"
    >
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 * i, ease: ease.editorial }}
          className="inline-block"
        >
          {c}
        </motion.span>
      ))}
    </div>
  )
}
