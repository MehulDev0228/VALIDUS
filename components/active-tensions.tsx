"use client"

import { motion } from "framer-motion"
import { ease } from "@/lib/motion"
import { ChamberLink } from "@/components/chamber"
import { type Tension } from "@/lib/cognition"

/**
 * ActiveTensions — the cognition pulse of the founder's current state.
 *
 * Up to four tensions surface above the thought stream:
 *   - strongest conviction (BUILD with high score, recent)
 *   - biggest unresolved risk (recent PIVOT, low score)
 *   - pattern returning (idea revisited multiple times)
 *   - recent scar (KILL within 7d)
 *
 * The point isn't a list of "things". It's a strategic pulse.
 * Each tension reads like a quiet observation a chief-of-staff would
 * leave on the desk before you sat down.
 */
export function ActiveTensions({ tensions }: { tensions: Tension[] }) {
  if (tensions.length === 0) return null

  return (
    <section className="border-t border-bone-0/[0.08] pt-12 md:pt-16">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="mono-caption text-ember/70">active tensions</p>
          <h2 className="mt-3 font-serif text-[clamp(28px,3.4vw,44px)] font-light leading-[1.1] tracking-[-0.025em] text-bone-0">
            What's pulling at your thinking.
          </h2>
        </div>
        <span className="mono-caption tabular text-bone-2">
          {tensions.length} on record
        </span>
      </header>

      <ul className="grid grid-cols-1 gap-px bg-bone-0/[0.06] md:grid-cols-2">
        {tensions.map((t, i) => (
          <TensionCard key={`${t.kind}-${t.ideaId}`} tension={t} index={i} />
        ))}
      </ul>
    </section>
  )
}

function TensionCard({ tension, index }: { tension: Tension; index: number }) {
  const accent =
    tension.kind === "conviction"
      ? "text-verdict-build"
      : tension.kind === "risk"
      ? "text-verdict-pivot"
      : tension.kind === "dependency"
      ? "text-mist"
      : "text-ash"

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.08 * index, ease: ease.editorial }}
      className="group relative bg-ink-0"
    >
      <ChamberLink
        href={`/dashboard/validate?ideaId=${encodeURIComponent(tension.ideaId)}`}
        className="block p-8 transition-[transform,box-shadow,background-color] duration-500 hover:scale-[1.01] hover:bg-ink-1/60 hover:shadow-[0_22px_60px_-40px_rgb(23_26_31_/_0.14)] md:p-10"
      >
        {/* Label — small, ember-tinted */}
        <div className="flex items-center gap-3">
          <span className={`mono-caption ${accent}`}>{tension.label}</span>
          <span className="h-px flex-1 bg-bone-0/[0.08]" />
        </div>

        {/* Idea title — editorial weight */}
        <h3 className="mt-6 font-serif text-[clamp(20px,2vw,28px)] font-light leading-[1.2] tracking-[-0.015em] text-bone-0">
          {tension.ideaTitle}
        </h3>

        {/* Detail — a single observed line */}
        <p className="mt-3 max-w-[44ch] font-serif italic text-[15px] leading-[1.55] text-bone-1">
          {tension.detail}
        </p>

        {/* Quiet revisit cue */}
        <div className="mt-8 flex items-center gap-2">
          <span className="mono-caption text-bone-2 transition-colors duration-300 group-hover:text-bone-1">
            revisit
          </span>
          <span className="mono-caption text-bone-2 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-bone-1">
            →
          </span>
        </div>
      </ChamberLink>
    </motion.li>
  )
}
