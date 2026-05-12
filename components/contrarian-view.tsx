"use client"

import { motion } from "framer-motion"
import { ease } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Verdict = "BUILD" | "PIVOT" | "KILL"

function leanTone(lean: Verdict): string {
  if (lean === "BUILD") return "text-verdict-build border-verdict-build/35 bg-verdict-build/10"
  if (lean === "KILL") return "text-verdict-kill border-verdict-kill/35 bg-verdict-kill/10"
  return "text-verdict-pivot border-verdict-pivot/35 bg-verdict-pivot/10"
}

export type DissentEntry = {
  agent: string
  verdictLean: Verdict
  dissentSummary: string
}

/** Surfaces specialists who disagreed with the final band — builds trust through transparency. */
export function ContrarianView({
  dissent,
  defaultOpen = false,
}: {
  dissent: DissentEntry[]
  defaultOpen?: boolean
}) {
  if (!dissent?.length) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.65, ease: ease.editorial }}
      className="mt-14 md:mt-20"
      data-pi-section="contrarian_view"
    >
      <details open={defaultOpen} className="group overflow-hidden rounded-sm border border-bone-0/[0.08] bg-gradient-to-br from-bone-0/[0.04] to-transparent [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 md:px-8 md:py-6">
          <div>
            <div className="mono-caption text-ember/70">Dissent on record</div>
            <h2 className="mt-2 font-serif text-[clamp(22px,2.4vw,30px)] leading-tight tracking-[-0.02em]">
              The contrarian view
            </h2>
            <p className="mt-2 max-w-[640px] text-[13px] text-bone-2">
              Specialists who leaned differently than the final band — not hidden disagreements.
            </p>
          </div>
          <span className="mono-caption text-bone-2 transition-transform duration-300 group-open:rotate-180">▾</span>
        </summary>
        <ul className="divide-y divide-bone-0/[0.06] border-t border-bone-0/[0.06]">
          {dissent.map((d, i) => (
            <li key={`${d.agent}-${i}`} className="grid gap-4 px-5 py-6 md:grid-cols-[160px_1fr] md:gap-8 md:px-8">
              <div>
                <span className="mono-caption text-bone-2">{d.agent}</span>
                <div
                  className={cn(
                    "mt-2 inline-flex rounded-sm border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider",
                    leanTone(d.verdictLean),
                  )}
                >
                  leaned {d.verdictLean}
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-bone-0">{d.dissentSummary}</p>
            </li>
          ))}
        </ul>
      </details>
    </motion.section>
  )
}
