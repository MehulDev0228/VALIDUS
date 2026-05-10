"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { ease, timing } from "@/lib/motion"

const STEPS = [
  {
    n: "01",
    title: "Describe the wedge",
    body: "Write one honest paragraph: the problem, who you think pays, and why now.",
  },
  {
    n: "02",
    title: "Seven angles review",
    body: "Market, competition, revenue, build surface, buyer psychology, risks, and tests — same text, different reads.",
  },
  {
    n: "03",
    title: "Tensions surfaced",
    body: "When two angles collide, both stay legible. Nothing averaged into fake agreement.",
  },
  {
    n: "04",
    title: "Your memo",
    body: "BUILD / PIVOT / KILL band, compression-style read, and a 48-hour checklist you can execute.",
  },
] as const

export function TimelineSteps() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 72%", "end 28%"],
    layoutEffect: false,
  })

  const beamH = useTransform(scrollYProgress, [0, 1], reduce ? ["100%", "100%"] : ["0%", "100%"])

  return (
    <section
      ref={ref}
      id="how-it-works"
      data-section="timeline"
      className="relative bg-ink-0 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[900px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="mb-16 max-w-[620px]"
        >
          <p className="marketing-label text-ember/80">How it works</p>
          <h2 className="marketing-title mt-4 font-display">Four steps. Same path.</h2>
          <p className="marketing-body mt-5">
            No chat thread. File the brief, receive the memo layout, re-run when facts change.
          </p>
        </motion.div>

        <div className="relative pl-2 md:pl-4">
          <div className="absolute left-[17px] top-2 bottom-6 w-px bg-white/[0.08] md:left-[23px]">
            <motion.div
              className="absolute left-0 top-0 w-full rounded-full bg-gradient-to-b from-ember via-ember/60 to-transparent"
              style={{ height: beamH }}
            />
          </div>

          <ol className="space-y-12 md:space-y-16">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-6%" }}
                transition={{ duration: 0.55, delay: i * 0.06, ease: ease.editorial }}
                className="relative grid grid-cols-[40px_1fr] gap-6 md:grid-cols-[48px_1fr] md:gap-10"
              >
                <span className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-ink-1 font-mono text-[11px] text-ember">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-bone-0 md:text-xl">
                    {s.title}
                  </h3>
                  <p className="marketing-body mt-3 max-w-[56ch] text-[15px]">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
