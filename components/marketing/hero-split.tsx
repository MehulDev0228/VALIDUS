"use client"

import Link from "next/link"
import Balancer from "react-wrap-balancer"
import { useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import { TextGenerate } from "@/components/effects/text-generate"
import { GlassCard } from "@/components/effects/glass-card"
import { ease, timing } from "@/lib/motion"
import { microcopy } from "@/lib/microcopy"
import { cn } from "@/lib/utils"

export function HeroSplit() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
    layoutEffect: false,
  })
  const memoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -28])

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-section="hero"
      className="hero-shell relative isolate min-h-[min(92vh,920px)] overflow-hidden pb-24 pt-32 md:pt-40"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] dot-grid-hero opacity-[0.35]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-px bg-white/[0.06]"
      />

      <div className="relative z-[2] mx-auto grid max-w-[1320px] grid-cols-1 gap-16 px-6 md:px-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-16">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: timing.section.min, ease: ease.editorial }}
            className="flex items-center gap-3"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_16px_rgb(6_182_212_/_0.45)]" />
            <span className="marketing-label text-bone-1">{microcopy.hero.eyebrow}</span>
          </motion.div>

          <h1 className="marketing-display mt-8 max-w-[14ch] font-bold tracking-[-0.04em] md:max-w-none">
            <TextGenerate text="Check your idea before you sink months into build." />
          </h1>

          <p className="marketing-body mt-8 max-w-[560px] text-[17px] leading-relaxed text-bone-1">
            Get a structured memo — tensions left visible, a BUILD / PIVOT / KILL read, and a 48-hour
            test plan — in minutes after you file. Private, blunt, revisable.
          </p>
          <p className="marketing-body mt-4 max-w-[560px] text-bone-1">{microcopy.home.story}</p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/auth?next=/dashboard/validate"
              className="inline-flex items-center gap-2 rounded-md bg-ember px-5 py-3 text-[15px] font-semibold text-ink-0 shadow-[0_10px_36px_-10px_rgb(6_182_212_/_0.55)] transition hover:bg-[#22d3ee] hover:shadow-[0_14px_44px_-10px_rgb(6_182_212_/_0.5)] active:scale-[0.98]"
            >
              Try it free
              <span aria-hidden className="text-ink-0/90">
                →
              </span>
            </Link>
            <Link
              href="#sample-memo"
              className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.03] px-5 py-3 text-[15px] font-medium text-bone-0 transition hover:border-white/[0.2] hover:bg-white/[0.06] active:scale-[0.98]"
            >
              View sample memo
              <span aria-hidden className="text-bone-2">
                ↓
              </span>
            </Link>
            <Link
              href="/alpha"
              className="inline-flex items-center gap-2 rounded-md px-4 py-3 text-[14px] font-medium text-ember transition hover:text-[#22d3ee]"
            >
              {microcopy.preLaunch.ribbonCta}
            </Link>
          </div>

          <p className="doc-kicker mt-14 max-w-[520px] border-t border-white/[0.06] pt-10 text-bone-2">
            <Balancer>
              Free to start after sign-in · daily run limit · private history when you&apos;re signed in
            </Balancer>
          </p>

          <div className="mt-10 hidden text-center md:block" aria-hidden>
            <span className="hero-scroll-hint inline-block text-xs tracking-[0.3em] text-bone-2">↓</span>
          </div>
        </div>

        <motion.div style={{ y: memoY }} className="flex items-center lg:justify-end">
          <MemoHeroPreview reduce={!!reduce} />
        </motion.div>
      </div>
    </section>
  )
}

/** Memo-shaped preview — reads like output, not a wireframe. */
function MemoHeroPreview({ reduce }: { reduce: boolean }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(mx, [-0.5, 0.5], reduce ? [0, 0] : [4, -4]), {
    stiffness: 120,
    damping: 22,
  })
  const ry = useSpring(useTransform(my, [-0.5, 0.5], reduce ? [0, 0] : [-5, 5]), {
    stiffness: 120,
    damping: 22,
  })

  function onMove(e: React.MouseEvent) {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const [hover, setHover] = useState<number | null>(null)

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
        setHover(null)
      }}
      style={{
        rotateX: ry,
        rotateY: rx,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      className="w-full max-w-[500px]"
    >
      <GlassCard className="border-white/[0.09] bg-ink-1/90 p-0 shadow-[0_32px_64px_-48px_rgb(0_0_0_/_0.85)]">
        <div className="rounded-[inherit] border border-white/[0.06] bg-[linear-gradient(180deg,rgb(var(--ink-1))_0%,rgb(var(--ink-0))_100%)]">
          <header className="border-b border-white/[0.06] px-6 py-4 md:px-8">
            <p className="doc-meta tabular">
              memo 0142-IM · filed 2026-05-08 · private
            </p>
          </header>

          <div className="px-6 py-8 md:px-8 md:py-10">
            <p className="doc-kicker text-ember/90">Idea</p>
            <h3 className="font-display mt-2 text-[1.35rem] font-semibold leading-snug tracking-tight text-bone-0 md:text-[1.5rem]">
              Vertical CRM for solo immigration lawyers — $99/mo wedge.
            </h3>

            <div className="mt-8">
              <p className="doc-kicker">Verdict band</p>
              <div className="mt-3 flex h-11 w-full overflow-hidden rounded-md">
                <div className="flex flex-[1.35] items-center justify-center bg-verdict-build/25 text-[11px] font-semibold uppercase tracking-wider text-verdict-build">
                  Build
                </div>
                <div className="flex flex-1 items-center justify-center bg-verdict-pivot/15 text-[11px] font-semibold uppercase tracking-wider text-verdict-pivot">
                  Pivot
                </div>
                <div className="flex flex-1 items-center justify-center bg-verdict-kill/15 text-[11px] font-semibold uppercase tracking-wider text-verdict-kill">
                  Kill
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-bone-2">
                <span>Compression</span>
                <span className="tabular font-medium text-bone-0">72 / 100</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-ember/80 to-ember/40" />
              </div>
            </div>

            <p className="doc-kicker mt-10">Tensions surfaced</p>
            <ul className="mt-4 space-y-3" onMouseLeave={() => setHover(null)}>
              <TensionRow
                severity="high"
                tag="REV"
                line="Buyer is the practitioner — budgets are thin and cycles are slow."
                dim={hover !== null && hover !== 0}
                active={hover === 0}
                onEnter={() => setHover(0)}
              />
              <TensionRow
                severity="med"
                tag="CMP"
                line="Substitutes bundle generic CRM cheaper than migration pain."
                dim={hover !== null && hover !== 1}
                active={hover === 1}
                onEnter={() => setHover(1)}
              />
            </ul>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function TensionRow({
  severity,
  tag,
  line,
  active,
  dim,
  onEnter,
}: {
  severity: "high" | "med"
  tag: string
  line: string
  active: boolean
  dim: boolean
  onEnter: () => void
}) {
  const tone =
    severity === "high" ? "text-verdict-kill/90" : "text-verdict-pivot/90"
  return (
    <li
      onMouseEnter={onEnter}
      className={cn(
        "rounded-lg border border-transparent px-3 py-2.5 transition-colors duration-200",
        dim ? "opacity-50" : "opacity-100",
        active && "border-white/[0.08] bg-white/[0.03]",
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", tone)}>
          {severity}
        </span>
        <span className="font-mono text-[11px] text-bone-2">{tag}</span>
        <span className={cn("min-w-0 flex-1 text-[14px] leading-snug", active ? "text-bone-0" : "text-bone-1")}>
          {line}
        </span>
      </div>
    </li>
  )
}
