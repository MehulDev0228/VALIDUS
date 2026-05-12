"use client"

import { motion } from "framer-motion"
import { ease, timing } from "@/lib/motion"

/* Inline product previews — real rendered components, NOT screenshots */

function WritingChamberPreview() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-ember/80" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-bone-2">Brief</span>
      </div>
      <div className="font-serif text-[14px] leading-relaxed text-bone-0/90">
        &ldquo;Vertical CRM for solo immigration lawyers — $99/mo…&rdquo;
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
          <div className="h-full w-[65%] rounded-full bg-ember/60" />
        </div>
        <span className="font-mono text-[9px] text-bone-2">142 chars</span>
      </div>
    </div>
  )
}

function VerdictHoldPreview() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <div className="flex h-10 w-full overflow-hidden rounded-md">
        <div className="flex flex-[1.3] items-center justify-center bg-verdict-build/25 text-[10px] font-bold uppercase tracking-wider text-verdict-build">
          Build
        </div>
        <div className="flex flex-1 items-center justify-center bg-verdict-pivot/15 text-[10px] font-bold uppercase tracking-wider text-verdict-pivot">
          Pivot
        </div>
        <div className="flex flex-1 items-center justify-center bg-verdict-kill/15 text-[10px] font-bold uppercase tracking-wider text-verdict-kill">
          Kill
        </div>
      </div>
      <span className="font-mono text-[10px] text-bone-2">verdict: BUILD · 72/100</span>
    </div>
  )
}

function ScoreBreakdownPreview() {
  const dims = [
    { label: "MKT", w: "72%", color: "bg-ember/70" },
    { label: "CMP", w: "58%", color: "bg-ember/55" },
    { label: "REV", w: "65%", color: "bg-ember/60" },
    { label: "BLD", w: "81%", color: "bg-ember/75" },
    { label: "ICP", w: "49%", color: "bg-ember/45" },
  ]
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {dims.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-7 font-mono text-[9px] text-bone-2">{d.label}</span>
          <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
            <div className={`h-full rounded-full ${d.color}`} style={{ width: d.w }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Plan48hPreview() {
  const steps = [
    { day: "D1", task: "Talk to 8 buyers", done: true },
    { day: "D1", task: "Price concierge pass", done: false },
    { day: "D2", task: "Kill unproven scope", done: false },
  ]
  return (
    <div className="flex flex-col gap-2 p-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="font-mono text-[9px] text-ember/80">{s.day}</span>
          <span className={`h-3 w-3 rounded-sm border ${s.done ? "border-verdict-build bg-verdict-build/20" : "border-white/[0.12] bg-transparent"}`}>
            {s.done && <span className="flex items-center justify-center text-[8px] text-verdict-build">✓</span>}
          </span>
          <span className={`text-[12px] ${s.done ? "text-bone-2 line-through" : "text-bone-1"}`}>{s.task}</span>
        </div>
      ))}
    </div>
  )
}

function ShareExplorePreview() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="rounded-md border border-white/[0.08] bg-ink-0/60 px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-bone-2">Public link</span>
        <p className="mt-1 truncate font-mono text-[11px] text-ember/90">/memo/your-run-id…</p>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-md border border-white/[0.06] px-3 py-2">
        <span className="text-[11px] text-bone-1">List on Explore</span>
        <span className="rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[9px] text-ember">on</span>
      </div>
      <p className="font-mono text-[9px] text-bone-2">Optional Twitter thread draft</p>
    </div>
  )
}

const STRIPS = [
  {
    title: "Writing chamber",
    caption: "Serif brief with live substance meter and gutter cues",
    Preview: WritingChamberPreview,
  },
  {
    title: "Verdict hold",
    caption: "BUILD / PIVOT / KILL — one band, no ambiguity",
    Preview: VerdictHoldPreview,
  },
  {
    title: "Score breakdown",
    caption: "Five dimensions visualized — market, competition, revenue, build, ICP",
    Preview: ScoreBreakdownPreview,
  },
  {
    title: "48h plan",
    caption: "Day-by-day falsification checklist with success/fail criteria",
    Preview: Plan48hPreview,
    anchorId: "surface-48h",
  },
  {
    title: "Share & explore",
    caption: "Public memo URL, optional library listing, thread helper — after you save a run",
    Preview: ShareExplorePreview,
    anchorId: "surface-share",
  },
] as const

type AnimDir = { initial: Record<string, number>; transition?: { delay: number } }
const animVariety: AnimDir[] = [
  { initial: { opacity: 0, x: -24 } },
  { initial: { opacity: 0, y: 28 } },
  { initial: { opacity: 0, x: 24 } },
  { initial: { opacity: 0, scale: 0.94 } },
  { initial: { opacity: 0, y: 22 } },
  { initial: { opacity: 0, x: -18 } },
]

/** Replaces the generic vertical timeline — horizontal product journey with distinct motion. */
export function ProductFlowStrip() {
  return (
    <section id="how-it-works" data-section="product-flow" className="relative bg-ink-0 py-24 md:py-32">
      <div className="mx-auto max-w-[1100px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="mb-12 max-w-[640px]"
        >
          <p className="marketing-label text-ember/80">How it works</p>
          <h2 className="marketing-title mt-4 font-display">Same pipeline. Four rooms.</h2>
          <p className="marketing-body mt-5">
            File a brief, receive a structured memo — including a two-day falsification map and (when you&apos;re signed in)
            tools to share a read-only link or surface your memo on{" "}
            <a href="/explore" className="text-bone-1 underline underline-offset-4 hover:text-ember">
              Explore
            </a>
            .
          </p>
        </motion.div>

        <div className="relative -mx-2 overflow-x-auto pb-4 pt-2 md:mx-0">
          <div className="flex min-w-min gap-5 px-2 md:gap-8 md:px-0">
            {STRIPS.map((s, i) => {
              const anim = animVariety[i]
              return (
                <motion.article
                  key={s.title}
                  id={"anchorId" in s ? s.anchorId : undefined}
                  initial={{ ...anim.initial }}
                  whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ duration: 0.55, delay: i * 0.09, ease: ease.editorial }}
                  className="group flex w-[min(72vw,320px)] shrink-0 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-ink-1/80 shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_24px_60px_-24px_rgb(0_0_0_/_0.5)]"
                >
                  {/* Inline rendered preview — REAL product UI */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-bone-0/[0.04] via-ink-1 to-ink-0">
                    <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
                    <div className="relative flex h-full items-center justify-center">
                      <div className="w-[88%] rounded-md border border-white/[0.06] bg-ink-0/70 backdrop-blur-sm">
                        <s.Preview />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-5 py-5">
                    <h3 className="font-display text-[17px] font-semibold tracking-tight text-bone-0">{s.title}</h3>
                    <p className="marketing-body mt-3 text-[14px] text-bone-2">{s.caption}</p>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
