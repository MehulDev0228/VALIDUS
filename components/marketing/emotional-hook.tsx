"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

export function EmotionalHook() {
  return (
    <section data-section="hook" className="relative border-b border-bone-0/[0.06] py-40 md:py-56">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.9, ease: ease.editorial }}
          className="font-serif text-[clamp(40px,7vw,104px)] leading-[1.04] tracking-[-0.03em] text-bone-0"
        >
          {splitEmphasis(microcopy.hook.line)}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: ease.editorial }}
          className="mt-12"
        >
          <Link href="/dashboard/validate" className="tab-cta">
            <span>{microcopy.hook.cta}</span>
            <span className="tab-cta-arrow">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function splitEmphasis(line: string) {
  // Italicize the clause after the em-dash for editorial weight
  const parts = line.split("—")
  if (parts.length < 2) return line
  return (
    <>
      {parts[0]}
      <span className="font-sans text-bone-0">—</span>
      <span className="italic text-bone-1">{parts.slice(1).join("—")}</span>
    </>
  )
}
