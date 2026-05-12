"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { ease } from "@/lib/motion"

function SevenAngleWheel() {
  const cx = 100
  const cy = 100
  const r = 78
  const labels = ["MKT", "CMP", "REV", "BLD", "ICP", "RSK", "TST"]
  return (
    <svg
      viewBox="0 0 200 200"
      className="mx-auto mt-auto h-[220px] w-full max-w-[280px] text-ember/50"
      aria-hidden
    >
      <circle cx={cx} cy={cy} r={10} fill="currentColor" className="text-ember/70" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2
        const x2 = cx + r * Math.cos(a)
        const y2 = cy + r * Math.sin(a)
        return (
          <motion.line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={1.25}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.03 * i, ease: ease.editorial }}
          />
        )
      })}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2
        const x = cx + (r + 18) * Math.cos(a)
        const y = cy + (r + 18) * Math.sin(a)
        return (
          <text
            key={labels[i]}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-bone-2 font-mono text-[9px]"
            style={{ fontSize: "10px" }}
          >
            {labels[i]}
          </text>
        )
      })}
    </svg>
  )
}

const easeOut = [0.22, 1, 0.36, 1] as const

export function BentoFeatures() {
  return (
    <section
      id="features-bento"
      data-section="bento"
      className="relative border-y border-white/[0.06] bg-ink-1/35 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
          whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.65, ease: easeOut }}
          className="max-w-[640px]"
        >
          <p className="marketing-label text-ember/80">Inside the memo</p>
          <h2 className="marketing-title mt-4 font-display">Seven angles. One verdict. Zero fluff.</h2>
          <p className="marketing-body mt-5 text-bone-1">
            Seven fixed angles, visible disagreement, one verdict band, and a test plan — same
            structure so every filing is comparable.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {/* FEATURED: Seven angles — slides from left */}
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.6, ease: ease.editorial }}
            className="md:col-span-7 md:row-span-2"
          >
            <div className="bento-featured relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-ember/20 bg-gradient-to-br from-ember/[0.06] via-ink-0 to-ink-0 p-8 pl-9 shadow-inner shadow-black/20 transition-all duration-300 hover:-translate-y-[2px] hover:border-ember/30 hover:shadow-[0_20px_60px_-30px_rgb(6_182_212_/_0.15)] md:p-10 md:pl-12">
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-ember/80 via-ember/30 to-ember/10"
              />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ember/25 bg-ember/10 text-[15px] text-ember">◆</span>
              <h3 className="font-display mt-5 text-2xl font-semibold tracking-tight text-bone-0 md:text-3xl">
                Seven angles
              </h3>
              <p className="marketing-body mt-3 max-w-[48ch]">
                Market, competition, revenue, build cost, buyer psychology, failure modes, and next
                tests — each reads the same brief independently.
              </p>
              <SevenAngleWheel />
            </div>
          </motion.div>

          {/* FEATURED: Verdict — scales from center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.58, delay: 0.06, ease: [0.34, 1.56, 0.64, 1] }}
            className="md:col-span-5"
          >
            <div className="bento-featured relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-xl border border-ember/20 bg-gradient-to-b from-ember/12 via-ink-1 to-ink-1 p-8 pl-9 transition-all duration-300 hover:-translate-y-[2px] hover:border-ember/30 hover:shadow-[0_20px_60px_-30px_rgb(6_182_212_/_0.15)] md:pl-12">
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-ember/90 via-ember/40 to-transparent"
              />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ember/25 bg-ember/10">
                <span className="h-2 w-2 rounded-full bg-ember shadow-[0_0_12px_rgb(6_182_212_/_0.5)]" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-bone-0">BUILD · PIVOT · KILL</h3>
              <p className="marketing-body mt-3 flex-1 text-sm">
                One band with plain language — a frame for the next two days, not a vanity score.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md border border-verdict-build/40 bg-verdict-build/15 px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-wide text-verdict-build">
                  Build
                </span>
                <span className="rounded-md border border-verdict-pivot/40 bg-verdict-pivot/12 px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-wide text-verdict-pivot">
                  Pivot
                </span>
                <span className="rounded-md border border-verdict-kill/40 bg-verdict-kill/12 px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-wide text-verdict-kill">
                  Kill
                </span>
              </div>
            </div>
          </motion.div>

          {/* SUPPORTING: Tensions — dashed border, fades up */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.55, delay: 0.1, ease: ease.editorial }}
            className="md:col-span-7"
          >
            <div className="rounded-xl border border-dashed border-white/[0.14] bg-transparent p-8 transition-all duration-300 hover:-translate-y-[2px] hover:border-white/[0.22] hover:shadow-[0_16px_48px_-24px_rgb(0_0_0_/_0.4)] md:p-12">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06]">
                <span className="text-[14px] text-bone-2">⚡</span>
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-bone-0">Disagreement stays visible</h3>
              <p className="marketing-body mt-3">
                Where angles read the same sentence differently, both sides stay on the page.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-ink-0/50 p-4">
                  <span className="mt-0.5 h-full w-0.5 min-h-[32px] shrink-0 rounded-full bg-verdict-kill" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-verdict-kill/90">
                      High
                    </p>
                    <p className="mt-2 text-[14px] leading-snug text-bone-1">Substitution risk from bundled incumbents.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-ink-0/50 p-4">
                  <span className="mt-0.5 h-full w-0.5 min-h-[32px] shrink-0 rounded-full bg-verdict-pivot" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-verdict-pivot/90">
                      Med
                    </p>
                    <p className="mt-2 text-[14px] leading-snug text-bone-1">Build surface heavier than the wedge.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SUPPORTING: 48h plan — slides from right */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.55, delay: 0.16, ease: ease.editorial }}
            className="md:col-span-5"
          >
            <div className="h-full rounded-xl border border-white/[0.07] bg-ink-1 p-8 transition-all duration-300 hover:-translate-y-[2px] hover:border-white/[0.14] hover:shadow-[0_16px_48px_-24px_rgb(0_0_0_/_0.4)]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06]">
                <span className="text-[14px] text-bone-2">⏱</span>
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-bone-0">Cheap tests first</h3>
              <p className="marketing-body mt-3 text-sm">
                A short checklist tied to this pass — disprove before you fund the build.
              </p>
              <ul className="mt-6 space-y-3">
                {["Talk to 8 buyers in the wedge", "Price a manual concierge pass", "Kill scope that isn't proven"].map(
                  (t, i) => (
                    <motion.li
                      key={t}
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                      className="flex items-start gap-3 text-[14px] text-bone-1"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" strokeWidth={2} aria-hidden />
                      {t}
                    </motion.li>
                  ),
                )}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
