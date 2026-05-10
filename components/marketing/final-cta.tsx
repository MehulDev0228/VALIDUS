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
              <Link
                href="/auth?next=/dashboard/validate"
                className="inline-flex items-center gap-2 rounded-md bg-ember px-5 py-3 text-[15px] font-semibold text-ink-0 shadow-[0_10px_36px_-10px_rgb(6_182_212_/_0.5)] transition hover:bg-[#22d3ee] active:scale-[0.98]"
              >
                Run a memo
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="#sample-memo"
                className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] px-5 py-3 text-[14px] font-medium text-bone-0 transition hover:border-white/[0.2] hover:bg-white/[0.05]"
              >
                Open sample memo
                <span aria-hidden className="text-bone-2">
                  ↑
                </span>
              </Link>
            </div>

            <p className="mt-5 text-right text-[13px] leading-relaxed text-bone-2 md:text-[14px]">
              Free to start · Private · No card to explore
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
