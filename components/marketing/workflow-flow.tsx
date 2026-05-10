"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { ease, timing } from "@/lib/motion"

/**
 * WorkflowFlow — the "what actually happens" section.
 *
 * Five-step vertical timeline. As the user scrolls, a 1px ember line
 * draws itself down the spine, anchoring numbered cognition stations.
 * Each station has its own visual vignette on the off-side so the rhythm
 * stays alive — short / wide / dense / quiet / dramatic.
 *
 * The point is operational clarity: the founder finishes this section
 * understanding exactly what VERDIKT does to their idea.
 */

interface Step {
  n: string
  title: string
  body: string
  vignette: "input" | "pressure" | "contradiction" | "memo" | "memory"
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "You write the idea",
    body: "Describe the wedge, the buyer, the price point, and what makes you think this works. A few hundred words. Plain language.",
    vignette: "input",
  },
  {
    n: "02",
    title: "Seven angles read the same brief",
    body: "Market, competition, economics, build surface, buyer, failure modes, and next tests. Each angle is independent — no averaging into fake agreement.",
    vignette: "pressure",
  },
  {
    n: "03",
    title: "Disagreement stays visible",
    body: "When two angles read the same line differently, the memo shows both. You decide which claim to test first.",
    vignette: "contradiction",
  },
  {
    n: "04",
    title: "You get one memo page",
    body: "BUILD / PIVOT / KILL band, why each side could be right, a compression-style score, and a 48-hour checklist.",
    vignette: "memo",
  },
  {
    n: "05",
    title: "Saved runs stack in your archive",
    body: "Signed-in history shows reruns, verdict drift, and patterns across ideas — no social feed, no badges.",
    vignette: "memory",
  },
]

export function WorkflowFlow() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 60%", "end 40%"],
  })
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      data-section="workflow"
      className="relative isolate bg-ink-1 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Section header — quiet, no oversized type, no glow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="mb-20 max-w-[620px] md:mb-24"
        >
          <p className="marketing-label">How it works</p>
          <h2 className="marketing-title mt-4 font-sans">
            Five steps. Same path every time.
          </h2>
          <p className="marketing-body mt-6 max-w-[560px]">
            No chat thread. You write once, the pipeline runs, you get a printable-style memo. Re-run when the idea changes.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative mx-auto max-w-[1100px]">
          {/* Spine — base track */}
          <div
            aria-hidden
            className="absolute left-[28px] top-0 h-full w-px bg-bone-0/[0.1] md:left-1/2"
          />
          {/* Spine — ember progress that draws on scroll */}
          {!reduce && (
            <motion.div
              aria-hidden
              style={{ height: lineHeight }}
              className="absolute left-[28px] top-0 w-px bg-gradient-to-b from-ember/0 via-ember/60 to-ember/0 md:left-1/2"
            />
          )}

          <ol className="space-y-20 md:space-y-24">
            {STEPS.map((step, i) => (
              <Station key={step.n} step={step} index={i} reduce={!!reduce} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Station                                                                   */
/* -------------------------------------------------------------------------- */

function Station({ step, index, reduce }: { step: Step; index: number; reduce: boolean }) {
  const sideLeft = index % 2 === 0

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: timing.section.mid, ease: ease.editorial }}
      className="relative grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start md:gap-14"
    >
      {/* Station node — flat dot on the spine, no pulsing halo */}
      <div
        aria-hidden
        className="absolute left-[28px] top-2 z-10 -translate-x-1/2 md:left-1/2"
      >
        <span className="block h-2 w-2 rounded-full bg-ember/70 ring-2 ring-ink-1" />
      </div>

      {/* Copy column — alternates side on desktop, always full-bleed on mobile */}
      <div
        className={`relative pl-14 md:pl-0 ${
          sideLeft ? "md:pr-12 md:text-right" : "md:order-2 md:pl-12"
        }`}
      >
        <p className={`mono-caption tabular text-bone-2`}>step {step.n}</p>
        <h3 className="mt-3 font-sans font-medium text-bone-0 text-[clamp(19px,1.9vw,24px)] leading-[1.25] tracking-[-0.015em]">
          {step.title}
        </h3>
        <p className={`mt-4 max-w-[44ch] text-[15px] leading-[1.6] text-bone-1 ${sideLeft ? "md:ml-auto" : ""}`}>
          {step.body}
        </p>
      </div>

      {/* Vignette column — visual anchor for the step */}
      <div
        className={`pl-14 md:pl-0 ${
          sideLeft ? "md:order-2 md:pl-12" : "md:pr-12"
        }`}
      >
        <Vignette kind={step.vignette} reduce={reduce} />
      </div>
    </motion.li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Vignettes                                                                 */
/* -------------------------------------------------------------------------- */

function Vignette({ kind, reduce }: { kind: Step["vignette"]; reduce: boolean }) {
  switch (kind) {
    case "input":
      return <VignetteInput />
    case "pressure":
      return <VignettePressure reduce={reduce} />
    case "contradiction":
      return <VignetteContradiction />
    case "memo":
      return <VignetteMemo />
    case "memory":
      return <VignetteMemory />
  }
}

function VignetteInput() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-bone-0/[0.08] md:p-7">
      <p className="mono-caption text-bone-2">your brief</p>
      <p className="mt-4 text-[15.5px] leading-[1.55] text-bone-0">
        A vertical CRM for solo immigration lawyers, priced at $99/mo. They run
        cases in spreadsheets, but they buy slowly and have no ops budget.
      </p>
      <div className="mt-6 flex items-center justify-between border-t border-bone-0/[0.08] pt-4">
        <span className="mono-caption tabular text-bone-2">428 chars</span>
        <span className="mono-caption tabular text-bone-2">⌘⏎ to file</span>
      </div>
    </div>
  )
}

function VignettePressure({ reduce }: { reduce: boolean }) {
  const angles = [
    { tag: "MKT", name: "market reality" },
    { tag: "CMP", name: "competitive pressure" },
    { tag: "REV", name: "revenue truth" },
    { tag: "BLD", name: "build cost" },
    { tag: "ICP", name: "buyer psychology" },
    { tag: "RSK", name: "failure modes" },
    { tag: "TST", name: "what to test" },
  ]
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-bone-0/[0.08] md:p-7">
      <div className="flex items-center justify-between">
        <span className="mono-caption text-bone-2">7 angles · running</span>
        <span className={`mono-caption tabular text-bone-2 ${reduce ? "" : "breathe"}`}>active</span>
      </div>
      <ul className="mt-5 space-y-2.5">
        {angles.map((a, i) => (
          <motion.li
            key={a.tag}
            initial={{ opacity: 0, x: -4 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: timing.section.min, delay: i * 0.04, ease: ease.editorial }}
            className="grid grid-cols-[48px_1fr_auto] items-baseline gap-3"
          >
            <span className="mono-caption tabular text-bone-2">{a.tag}</span>
            <span className="text-[14px] text-bone-0">{a.name}</span>
            <span className="mono-caption tabular text-bone-2">·</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function VignetteContradiction() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-bone-0/[0.08] md:p-7">
      <p className="mono-caption text-bone-2">contradiction</p>
      <div className="mt-5 space-y-4">
        <div className="border-l-2 border-verdict-build/40 pl-4">
          <p className="mono-caption text-verdict-build/80">claim A</p>
          <p className="mt-1 text-[14px] leading-[1.5] text-bone-0">
            Enterprise-grade workflow tooling for legal practices.
          </p>
        </div>
        <div className="border-l-2 border-ash/40 pl-4">
          <p className="mono-caption text-ash/80">claim B</p>
          <p className="mt-1 text-[14px] leading-[1.5] text-bone-0">
            Solo-practitioner UX, $99/mo, no ops budget.
          </p>
        </div>
      </div>
      <p className="mt-5 text-[14px] leading-[1.55] text-bone-1">
        Both claims cannot be the wedge. One has to win before the build.
      </p>
    </div>
  )
}

function VignetteMemo() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-bone-0/[0.08] md:p-7">
      <div className="flex items-center justify-between">
        <span className="mono-caption text-bone-2">memo · filed</span>
        <span className="mono-caption tabular text-bone-2">2026-05-08</span>
      </div>
      <div className="mt-5 flex items-baseline gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-verdict-build" />
        <span className="font-sans text-[32px] font-medium leading-none tracking-[-0.02em] text-verdict-build md:text-[36px]">
          BUILD
        </span>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="mono-caption tabular text-bone-2">compression score</span>
          <span className="mono-caption tabular text-bone-1">72/100</span>
        </div>
        <div className="h-px w-full bg-bone-0/[0.1]">
          <div className="h-px w-[72%] bg-verdict-build" />
        </div>
      </div>
      <p className="mt-5 text-[14px] leading-[1.55] text-bone-1">
        The wedge survives contact with reality, but only if you commit to the
        solo segment in the first 48 hours.
      </p>
    </div>
  )
}

function VignetteMemory() {
  const events = [
    { d: "2026-04-12", v: "PIVOT", note: "wedge framed as enterprise. Too broad." },
    { d: "2026-04-26", v: "PIVOT", note: "narrowed to legal vertical. Scope still wide." },
    { d: "2026-05-08", v: "BUILD", note: "solo immigration locked. Contradiction resolved." },
  ]
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-bone-0/[0.08] md:p-7">
      <p className="mono-caption text-bone-2">decision history · this idea</p>
      <ul className="mt-5 space-y-3.5">
        {events.map((e, i) => (
          <li key={e.d} className="grid grid-cols-[80px_56px_1fr] items-baseline gap-3">
            <span className="mono-caption tabular text-bone-2">{e.d}</span>
            <span
              className={`mono-caption tabular ${
                e.v === "BUILD"
                  ? "text-verdict-build"
                  : e.v === "PIVOT"
                  ? "text-verdict-pivot"
                  : "text-verdict-kill"
              }`}
            >
              {e.v}
            </span>
            <span
              className={`text-[14px] leading-[1.5] ${i === events.length - 1 ? "text-bone-0" : "text-bone-1"}`}
            >
              {e.note}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-bone-0/[0.08] pt-4 text-[14px] leading-[1.55] text-bone-1">
        Conviction <span className="text-verdict-build">↗ rising</span> across 3 revisits. The contradiction is resolved.
      </p>
    </div>
  )
}
