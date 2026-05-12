"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

const ANGLES = [
  { tag: "MKT", name: "Market reality", line: "Tier-2 willingness-to-pay is thin. Pricing assumption flagged." },
  { tag: "CMP", name: "Competitive pressure", line: "Three incumbents already ship 70% of the wedge — for free." },
  { tag: "REV", name: "Revenue truth", line: "Buyer is the engineer. Engineers don't have budget." },
  { tag: "BLD", name: "Build cost", line: "Integration surface is bigger than the wedge. Risk: 9 months to demo." },
  { tag: "ICP", name: "Buyer psychology", line: "Status incentive is weak. No-one shares this with their team." },
  { tag: "RSK", name: "Failure modes", line: "If GitHub adds this in Q3, the company is dead in a quarter." },
  { tag: "TST", name: "What to try", line: "48h test: 12 paid pilots or kill it. No moral victories." },
]

const PHASE_LINES: Record<number, string[]> = {
  0: [
    "Parsing the claim surface and stripping optimism noise.",
    "Locating real buyer, real pain, real urgency.",
    "Extracting assumptions that can actually fail.",
  ],
  1: [
    "Pulling country and segment-specific market signal.",
    "Comparing willingness-to-pay against status-quo behavior.",
    "Measuring competitive overlap and substitution risk.",
  ],
  2: [
    "Different angles land on the same sentences with different readings.",
    "Disagreement stays legible — nothing averaged for comfort.",
    "Soft claims become testable because they are named plainly.",
  ],
  3: [
    "A single clear frame is tightening — still revisable tomorrow.",
    "If-works / if-fails arcs are written soberly beside it.",
    "A 48-hour pressure arc attaches without moralizing hustle.",
  ],
}

/**
 * LoadingTheatre — full-screen 4-phase reveal.
 *
 * Keeps structured dramatic pacing (decode → context → tension → frame)
 * but removes OS-boot language. Each phase has emotional weight.
 * The verdict reveal is still cinematic — that moment matters.
 */
export function LoadingTheatre({
  onCancel,
  finished,
  verdictHint = "BUILD",
  pipelineHint,
}: {
  onCancel?: () => void
  finished?: boolean
  verdictHint?: "BUILD" | "PIVOT" | "KILL"
  /** Live pipeline status from SSE (optional). */
  pipelineHint?: string | null
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [phaseLineIdx, setPhaseLineIdx] = useState(0)

  const barWidth = reduce ? "100%" : `${[28, 52, 76, 100][phase]}%`

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 3000)
    const t2 = setTimeout(() => setPhase(2), 7000)
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
      if (i >= ANGLES.length) clearInterval(id)
    }, 450)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    setPhaseLineIdx(0)
    const lines = PHASE_LINES[phase] || []
    if (lines.length <= 1) return
    const id = setInterval(() => {
      setPhaseLineIdx((prev) => (prev + 1) % lines.length)
    }, 950)
    return () => clearInterval(id)
  }, [phase])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-0 text-bone-0">
      <motion.div
        aria-hidden
        className="absolute left-0 top-0 z-[60] h-0.5 max-w-full bg-ember/70"
        initial={{ width: "0%" }}
        animate={{ width: barWidth }}
        transition={{ duration: 0.85, ease: ease.editorial }}
      />

      {/* Top bar — warm, not clinical */}
      <header className="flex h-16 items-center justify-between border-b border-bone-0/[0.06] px-6 md:px-10">
        <div className="flex items-center gap-3">
          <span className="relative h-2 w-2">
            <motion.span
              className="absolute inset-0 rounded-full bg-ember"
              animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
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

      {pipelineHint ? (
        <div className="border-b border-bone-0/[0.06] px-6 py-2 md:px-10" aria-live="polite">
          <p className="mono-caption text-ember/75">{pipelineHint}</p>
        </div>
      ) : null}

      {/* Phase progress — warm accents */}
      <div className="grid grid-cols-4 border-b border-bone-0/[0.06]">
        {microcopy.loading.phases.map((p, i) => (
          <div
            key={p.label}
            className={`px-6 py-3 text-left ${
              i <= phase ? "bg-bone-0/[0.02]" : "bg-transparent"
            }`}
          >
            <div className={`mono-caption tabular ${i <= phase ? "text-ember/60" : "text-bone-2"}`}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className={`mt-1 text-[13px] ${
                i === phase ? "text-bone-0" : "text-bone-2"
              }`}
            >
              {p.label}
            </div>
            <div className="mt-3 h-px bg-bone-0/[0.06]">
              {i <= phase && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: i < phase ? "100%" : "62%" }}
                  transition={{ duration: i < phase ? 0.6 : 6, ease: ease.editorial }}
                  className="h-px bg-ember/40"
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
                <p className="mono-caption mb-6 text-ember/60" aria-live="polite">
                  01 — {microcopy.loading.phases[0].label}
                </p>
                <p className="font-serif text-[clamp(28px,4vw,48px)] leading-snug" aria-live="polite">
                  {PHASE_LINES[0][phaseLineIdx] || microcopy.loading.phases[0].line}
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
                <p className="mono-caption mb-6 text-ember/60" aria-live="polite">
                  02 — {microcopy.loading.phases[1].label}
                </p>
                <p className="font-serif text-[clamp(28px,3.4vw,40px)] leading-snug" aria-live="polite">
                  {PHASE_LINES[1][phaseLineIdx] || microcopy.loading.phases[1].line}
                </p>
              </div>
              <div className="col-span-12 md:col-span-7">
                <ResearchStream />
              </div>
            </motion.section>
          )}

          {phase === 2 && (
            <motion.section
              key="tension"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mx-auto h-full max-w-[1040px] px-6 py-12"
            >
              <p className="mono-caption mb-6 text-ember/60" aria-live="polite">
                03 — {microcopy.loading.phases[2].label}
              </p>
              <ul className="divide-y divide-bone-0/[0.05] border-y border-bone-0/[0.05]">
                {ANGLES.slice(0, revealed).map((a) => (
                  <motion.li
                    key={a.tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: ease.editorial }}
                    className="grid grid-cols-[64px_140px_1fr] items-baseline gap-6 py-4"
                  >
                    <span className="mono-caption tabular text-ember/40">{a.tag}</span>
                    <span className="text-[14px] text-bone-0">{a.name}</span>
                    <span className="text-[15px] leading-snug text-bone-1">
                      {a.line}
                    </span>
                  </motion.li>
                ))}
              </ul>
              <p className="mono-caption mt-8 text-bone-2">
                {revealed} of 7 angles on record
              </p>
            </motion.section>
          )}

          {phase === 3 && (
            <motion.section
              key="frame"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid h-full place-items-center px-6"
            >
              <div className="text-center">
                <p className="mono-caption mb-6 text-ember/60" aria-live="polite">
                  04 — {microcopy.loading.phases[3].label}
                </p>
                <VerdictReveal text={verdictHint} />
                <p className="mt-8 font-serif text-[20px] italic text-bone-1" aria-live="polite">
                  {PHASE_LINES[3][phaseLineIdx] || microcopy.loading.phases[3].line}
                </p>
                {finished && (
                  <p className="mono-caption mt-10 text-bone-2">
                    Composing your read…
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

const RESEARCH_STREAM_LINES = [
  "querying competitive landscape — 18 hits",
  "country profile: US / segment: SMB engineering",
  "willingness-to-pay distribution: bimodal",
  "incumbent overlap: 0.71 — high",
  "category CAC trend: rising 12% YoY",
  "search demand: stable, low intent",
  "buyer budget owner: VP Engineering",
  "switching cost vs. status quo: 2.1x",
] as const

function ResearchStream() {
  const [lines, setLines] = useState<string[]>([])
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setLines((prev) => [...prev, RESEARCH_STREAM_LINES[i % RESEARCH_STREAM_LINES.length]])
      i += 1
      if (i >= RESEARCH_STREAM_LINES.length) clearInterval(id)
    }, 540)
    return () => clearInterval(id)
  }, [])
  return (
    <ul className="space-y-2 font-mono text-[12px] tracking-[0.04em] text-bone-1">
      {lines.map((l, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: ease.editorial }}
          className="flex gap-3"
        >
          <span className="tabular text-ember/30">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{l}</span>
        </motion.li>
      ))}
    </ul>
  )
}

/**
 * VerdictReveal — the emotional weight moment.
 * This is one of the screenshot-worthy moments. Keeps its dramatic pacing.
 * Letters arrive with conviction. Color shifts with finality.
 */
function VerdictReveal({ text }: { text: string }) {
  const reduceLetters = useReducedMotion()
  const tone =
    text === "BUILD"
      ? "text-verdict-build"
      : text === "PIVOT"
      ? "text-verdict-pivot"
      : "text-verdict-kill"
  const toneDelay = Math.max(0.28, text.length * 0.09)
  return (
    <div
      className={`font-sans text-[clamp(80px,12vw,180px)] font-semibold leading-none tracking-[-0.04em] text-bone-0 ${tone}`}
      aria-live="polite"
    >
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          initial={{
            opacity: 0,
            y: 32,
            filter: reduceLetters ? "blur(0px)" : "blur(6px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            color: ["rgb(232 228 220)", "rgb(232 228 220)", "currentColor"],
          }}
          transition={{ duration: 0.28, delay: 0.08 * i, ease: ease.editorial, color: { delay: toneDelay } }}
          className="inline-block"
        >
          {c}
        </motion.span>
      ))}
    </div>
  )
}
