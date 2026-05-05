"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

/**
 * ReportPreview
 *
 * The sample memo tilts subtly toward the cursor with CSS 3D perspective
 * (max ±5° on each axis), like a piece of paper held under a lamp. A faint
 * highlight band tracks the cursor across the surface — the document
 * "catches the light" wherever you're reading.
 */
export function ReportPreview() {
  return (
    <section
      id="preview"
      data-section="preview"
      className="relative border-b border-bone-0/[0.06] py-32 md:py-40"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <p className="mono-caption">{microcopy.preview.eyebrow}</p>
            <h2 className="mt-6 font-serif text-[clamp(36px,4.5vw,56px)] leading-[1.05] tracking-[-0.025em]" data-cursor="read">
              {microcopy.preview.title}
            </h2>
            <p className="mt-6 max-w-[420px] text-[17px] leading-[1.55] text-bone-1" data-cursor="read">
              {microcopy.preview.body}
            </p>
            <div className="mt-8">
              <Link href="/auth?next=/dashboard/validate" className="tab-cta" data-cursor="file">
                <span>{microcopy.hero.ctaPrimary}</span>
                <span className="tab-cta-arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="col-span-12 md:col-span-8">
            <TiltMemo />
          </div>
        </div>
      </div>
    </section>
  )
}

function TiltMemo() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const lampRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const wrap = wrapRef.current
    const card = cardRef.current
    const lamp = lampRef.current
    if (!wrap || !card || !lamp) return

    let raf = 0
    const target = { rx: 0, ry: 0, lx: -200, ly: -200 }
    const current = { rx: 0, ry: 0, lx: -200, ly: -200 }

    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const nx = (e.clientX - cx) / (r.width / 2)
      const ny = (e.clientY - cy) / (r.height / 2)
      target.ry = Math.max(-1, Math.min(1, nx)) * 4.5
      target.rx = -Math.max(-1, Math.min(1, ny)) * 4.5
      target.lx = e.clientX - r.left
      target.ly = e.clientY - r.top
    }
    const onLeave = () => {
      target.rx = 0
      target.ry = 0
      target.lx = -400
      target.ly = -400
    }
    const tick = () => {
      current.rx += (target.rx - current.rx) * 0.12
      current.ry += (target.ry - current.ry) * 0.12
      current.lx += (target.lx - current.lx) * 0.18
      current.ly += (target.ly - current.ly) * 0.18
      card.style.transform = `perspective(1400px) rotateX(${current.rx.toFixed(3)}deg) rotateY(${current.ry.toFixed(3)}deg)`
      lamp.style.transform = `translate3d(${current.lx.toFixed(2)}px, ${current.ly.toFixed(2)}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    wrap.addEventListener("mousemove", onMove)
    wrap.addEventListener("mouseleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      wrap.removeEventListener("mousemove", onMove)
      wrap.removeEventListener("mouseleave", onLeave)
    }
  }, [reduce])

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: ease.editorial }}
      style={{ perspective: "1400px" }}
      className="relative"
    >
      <div
        ref={cardRef}
        className="relative border border-bone-0/10 bg-ink-1 p-8 will-change-transform md:p-12"
        style={{ transformStyle: "preserve-3d", transition: "transform 60ms linear" }}
      >
        {/* Lamp — a soft circular highlight that tracks the cursor across the page. */}
        <div
          ref={lampRef}
          aria-hidden
          className="pointer-events-none absolute -left-[180px] -top-[180px] h-[360px] w-[360px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,245,242,0.06) 0%, rgba(245,245,242,0.02) 40%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />

        <div className="relative flex items-center justify-between border-b border-bone-0/10 pb-6">
          <div className="mono-caption tabular">FV-2299 / 2026-05-06 / US / Dev tools</div>
          <div className="mono-caption">Confidential — founder copy</div>
        </div>

        <div className="relative mt-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7">
            <div className="mono-caption">Final verdict</div>
            <div className="mt-3 font-sans text-[clamp(80px,9vw,140px)] font-semibold leading-none tracking-[-0.04em] text-verdict-build">
              BUILD
            </div>
            <p className="mt-6 max-w-[420px] font-serif text-[22px] leading-snug italic text-bone-0">
              Painful, daily, paid. Seven design partners is not luck.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5">
            <div className="border border-bone-0/10 p-6">
              <div className="mono-caption">Opportunity score</div>
              <div className="tabular mt-3 font-sans text-[64px] font-medium leading-none tracking-[-0.03em]">
                82<span className="text-bone-2">/100</span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ["Confidence", 0.78],
                  ["Defensibility", 0.71],
                  ["Distribution", 0.55],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="mono-caption mb-1 flex justify-between">
                      <span>{k as string}</span>
                      <span className="tabular">{Math.round((v as number) * 100)}</span>
                    </div>
                    <div className="h-px bg-bone-0/10">
                      <div className="h-px bg-bone-0" style={{ width: `${(v as number) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-12 grid grid-cols-1 gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-2">
          <div className="bg-ink-1 p-6 md:p-8">
            <div className="mono-caption">If this works, it works because</div>
            <p className="mt-4 font-serif text-[22px] leading-snug italic text-bone-0">
              you replaced a daily JIRA ritual three engineers privately hate.
            </p>
          </div>
          <div className="bg-ink-1 p-6 md:p-8">
            <div className="mono-caption">If this fails, it fails because</div>
            <p className="mt-4 font-serif text-[22px] leading-snug italic text-bone-0">
              GitHub Copilot adds the same feature in two quarters and prices it at zero.
            </p>
          </div>
        </div>

        <div className="relative mt-12">
          <div className="mono-caption mb-4">48-hour falsification plan</div>
          <ol className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
            {[
              ["Day 1", "Post the wedge to 3 dev Slacks. Track replies vs. ignores."],
              ["Day 1", "DM 12 senior engineers. Ask: 'Would you pay $20/mo for this?'"],
              ["Day 2", "Land 3 paid pilots or call it. No moral victories."],
            ].map(([day, line], i) => (
              <li key={i} className="grid grid-cols-[80px_1fr_60px] items-baseline gap-6 py-4">
                <span className="mono-caption tabular">{day}</span>
                <span className="text-[15px] leading-snug text-bone-0">{line}</span>
                <span className="mono-caption text-right text-bone-2">{`#${i + 1}`}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </motion.div>
  )
}
