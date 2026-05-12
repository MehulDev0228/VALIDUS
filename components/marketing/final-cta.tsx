"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ease, timing } from "@/lib/motion"

export function FinalCTA() {
  return (
    <section
      id="enter"
      data-section="final-cta"
      className="relative isolate overflow-hidden bg-ink-0 py-24 md:py-32"
    >
      {/* Ambient gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(800px 400px at 50% 80%, rgb(6 182 212 / 0.04), transparent 60%)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:items-end md:gap-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: timing.section.mid, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7"
          >
            <h2 className="font-display text-[clamp(1.85rem,3.8vw,3.35rem)] font-bold leading-[1.05] tracking-[-0.035em]">
              Try it once.
            </h2>

            <p className="marketing-body mt-6 max-w-[58ch] text-bone-1">
              Describe the wedge bluntly — get the full memo shape with angles, tensions, verdict band,
              and a two-day checklist. Then decide what&apos;s worth a second filing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.5, delay: 0.05, ease: ease.editorial }}
            className="md:col-span-5 md:pb-1"
          >
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <span className="cta-shimmer-wrap rounded-md shadow-[0_10px_36px_-10px_rgb(6_182_212_/_0.45)]">
                <Link
                  href="/auth?next=/dashboard/validate"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-[calc(var(--radius-sm)-1px)] bg-ember px-6 py-3.5 text-[15px] font-semibold text-ink-0 transition hover:bg-[#22d3ee] active:scale-[0.98]"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100"
                  />
                  <span className="relative">Run a memo</span>
                  <span aria-hidden className="relative transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </span>
              <Link
                href="#sample-memo"
                className="inline-flex items-center gap-2 text-[14px] font-medium text-bone-1 transition hover:text-bone-0"
              >
                Open sample memo
                <span aria-hidden className="text-bone-2">
                  ↑
                </span>
              </Link>
            </div>

            <p className="mt-4 text-right text-[13px] text-bone-2/60">
              2 free runs / day · private · no card required
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
