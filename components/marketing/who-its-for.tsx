"use client"

import { motion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease, timing } from "@/lib/motion"

/**
 * Credible positioning — no testimonials until they're real.
 * Asymmetric layout (one editorial fingerprint without template grids).
 */
export function WhoItsFor() {
  const c = microcopy.whoItsFor
  return (
    <section
      data-section="who-its-for"
      className="relative overflow-hidden bg-ink-0 py-24 md:py-32"
    >
      <div className="pointer-events-none absolute right-0 top-1/2 h-[min(70%,520px)] w-[min(42vw,480px)] -translate-y-1/2 translate-x-1/4 rounded-full bg-ember/[0.04] blur-3xl" />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: timing.section.mid, ease: ease.editorial }}
            className="lg:col-span-7"
          >
            <p className="marketing-label text-ember/80">{c.eyebrow}</p>
            <h2 className="marketing-display mt-5 font-display text-balance">{c.title}</h2>
            <p className="marketing-body mt-6 max-w-[54ch] text-pretty text-bone-1">{c.lead}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: timing.section.mid, delay: 0.08, ease: ease.editorial }}
            className="lg:col-span-5"
          >
            <ul className="space-y-5 border-l-2 border-white/[0.08] pl-6">
              {c.bullets.map((line) => (
                <li key={line} className="text-[15px] leading-relaxed text-bone-0">
                  {line}
                </li>
              ))}
            </ul>
            <p className="doc-kicker mt-10 max-w-[48ch] border-t border-white/[0.06] pt-8 text-bone-2">
              {c.honesty}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
