"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { microcopy } from "@/lib/microcopy"

/**
 * SystemScroll — four-stage horizontal scroll-locked section.
 * Pins the viewport for 4 stages: Decode → Research → Debate → Rule.
 */
export function SystemScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"])
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="system" data-section="system" ref={ref} className="relative h-[400vh] border-b border-bone-0/[0.06]">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 pt-24 pb-6 md:px-10">
          <p className="mono-caption">{microcopy.system.eyebrow}</p>
          <ProgressTrack progress={progress} />
        </div>

        <motion.div style={{ x }} className="flex h-full w-[400vw]">
          {microcopy.system.stages.map((s, i) => (
            <Stage key={s.n} index={i} stage={s} total={microcopy.system.stages.length} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function Stage({
  index,
  stage,
  total,
}: {
  index: number
  stage: { n: string; title: string; body: string }
  total: number
}) {
  return (
    <div className="relative flex h-full w-screen items-center">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-12 gap-6 px-6 md:px-10">
        <div className="col-span-12 md:col-span-2">
          <div className="mono-caption tabular text-bone-0">{stage.n}</div>
          <div className="mono-caption mt-1 text-bone-2">
            of {String(total).padStart(2, "0")}
          </div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <div className="font-serif text-[clamp(56px,9vw,128px)] leading-[1] tracking-[-0.03em] text-bone-0">
            {stage.title}
          </div>
          <p className="mt-8 max-w-[480px] text-[17px] leading-[1.55] text-bone-1">
            {stage.body}
          </p>
        </div>
        <div className="col-span-12 md:col-span-3">
          <StageDiagram index={index} />
        </div>
      </div>
    </div>
  )
}

function ProgressTrack({ progress }: { progress: any }) {
  const width = useTransform(progress, [0, 1], ["0%", "100%"])
  return (
    <div className="relative h-px w-40 bg-bone-0/10 md:w-80">
      <motion.div style={{ width }} className="absolute inset-y-0 left-0 bg-bone-0" />
    </div>
  )
}

function StageDiagram({ index }: { index: number }) {
  // Minimal forensic glyph per stage — pure geometry, no illustration.
  return (
    <div className="aspect-square w-full max-w-[260px] border border-bone-0/10 p-6">
      {index === 0 && (
        <div className="grid h-full grid-cols-3 grid-rows-3 gap-[1px] bg-bone-0/10">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-ink-0" />
          ))}
        </div>
      )}
      {index === 1 && (
        <div className="flex h-full flex-col justify-between">
          {[0.3, 0.55, 0.8, 0.45, 0.7].map((w, i) => (
            <div
              key={i}
              className="h-px bg-bone-0/40"
              style={{ width: `${w * 100}%` }}
            />
          ))}
        </div>
      )}
      {index === 2 && (
        <div className="relative h-full w-full">
          {Array.from({ length: 7 }).map((_, i) => {
            const angle = (i * 360) / 7
            const r = 90
            const x = Math.cos((angle * Math.PI) / 180) * r
            const y = Math.sin((angle * Math.PI) / 180) * r
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-bone-0"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              />
            )
          })}
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-verdict-build" />
        </div>
      )}
      {index === 3 && (
        <div className="flex h-full flex-col items-start justify-end gap-3">
          <span className="font-sans text-[44px] font-semibold leading-none text-verdict-build">
            BUILD
          </span>
          <span className="mono-caption">verdict on file</span>
        </div>
      )}
    </div>
  )
}
