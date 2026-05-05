"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ease } from "@/lib/motion"

interface Deliverable {
  n: string
  what: string
  detail: string
  weight: "primary" | "secondary"
}

const DELIVERABLES: Deliverable[] = [
  {
    n: "01",
    what: "Final verdict — BUILD, PIVOT, or KILL",
    detail: "One word. With confidence. With reasoning. No 'maybe.'",
    weight: "primary",
  },
  {
    n: "02",
    what: "If this works, it works because…",
    detail: "The one structural reason this would survive the market.",
    weight: "primary",
  },
  {
    n: "03",
    what: "If this fails, it fails because…",
    detail: "The single most likely cause of death. Specific. Quotable.",
    weight: "primary",
  },
  {
    n: "04",
    what: "Opportunity score (0–100)",
    detail: "Composite of market, willingness-to-pay, defensibility, and feasibility.",
    weight: "secondary",
  },
  {
    n: "05",
    what: "Seven agent panels",
    detail: "Each specialist's pass at your idea, with contradictions surfaced.",
    weight: "secondary",
  },
  {
    n: "06",
    what: "Decoded brief",
    detail: "Real problem, real user, real market — stripped of pitch deck language.",
    weight: "secondary",
  },
  {
    n: "07",
    what: "Country-specific research signal",
    detail: "Trend, why it matters, strategic implication, opportunity angle.",
    weight: "secondary",
  },
  {
    n: "08",
    what: "Top fatal risks",
    detail: "Five ways this can die before it monetises. Ranked by likelihood.",
    weight: "secondary",
  },
  {
    n: "09",
    what: "48-hour falsification plan",
    detail: "Day-by-day actions, platforms, expected signals, success/fail criteria.",
    weight: "primary",
  },
]

export function Deliverables() {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, margin: "-20%" })

  return (
    <section
      ref={ref}
      data-section="deliverables"
      className="relative border-t border-bone-0/[0.06] py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <p className="mono-caption">06 — On delivery</p>
            <h2 className="mt-6 font-serif text-[clamp(36px,5vw,68px)] leading-[1.02] tracking-[-0.03em]">
              You file a brief.
              <br />
              <em className="font-serif italic text-bone-1">You receive a memo.</em>
            </h2>
            <p className="mt-6 max-w-[360px] text-[15px] leading-[1.55] text-bone-1">
              Not a chat reply. Not a checklist. A consulting-grade document you can send to a co-founder, an investor, or yourself in six months.
            </p>
            <p className="mono-caption mt-8 tabular text-bone-2">
              Average length: 2,400 words · Read time: 9 min · Cost: $0
            </p>
          </div>

          <div className="md:col-span-8">
            <ul className="border-t border-bone-0/[0.08]">
              {DELIVERABLES.map((d, i) => (
                <motion.li
                  key={d.n}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.04 * i, ease: ease.editorial }}
                  className="grid grid-cols-[36px_1fr] items-baseline gap-4 border-b border-bone-0/[0.08] py-5 md:grid-cols-[60px_minmax(0,1fr)_220px] md:gap-8"
                >
                  <span className="font-mono text-[11px] tabular tracking-[0.1em] text-bone-2">
                    {d.n}
                  </span>
                  <div>
                    <div
                      className={`font-serif tracking-[-0.015em] text-bone-0 ${
                        d.weight === "primary"
                          ? "text-[clamp(20px,2.4vw,30px)] leading-[1.15]"
                          : "text-[clamp(17px,1.9vw,22px)] leading-[1.25]"
                      }`}
                    >
                      {d.what}
                    </div>
                    <div className="mt-2 text-[14px] leading-snug text-bone-1 md:hidden">
                      {d.detail}
                    </div>
                  </div>
                  <div className="hidden text-[13px] leading-snug text-bone-1 md:block">
                    {d.detail}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
