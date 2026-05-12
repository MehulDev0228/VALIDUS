"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ease } from "@/lib/motion"
import { ChamberLink } from "@/components/chamber"
import { memoResultHref } from "@/lib/founder-workflow/memo-links"
import type { DecisionRecord } from "@/lib/founder-workflow/types"

/**
 * IdeaGraveyard — killed reflections, archived with quiet dignity.
 *
 * Killed ideas don't disappear. They move into a fading archive — typography
 * dims, metadata softens, the whole section sits at lower opacity until
 * focused. The founder can collapse it. The default is collapsed because
 * scars shouldn't dominate the room — they should be available, not loud.
 *
 * This is the "honored failure" surface. It's important emotionally:
 * a private acknowledgment that something didn't work, kept on record,
 * never erased.
 */
export function IdeaGraveyard({ records }: { records: DecisionRecord[] }) {
  const [open, setOpen] = useState(false)
  const kills = records.filter((r) => r.verdict === "KILL")

  if (kills.length === 0) return null

  return (
    <section className="border-t border-bone-0/[0.08] pt-12 md:pt-16">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-end justify-between text-left"
      >
        <div>
          <p className="mono-caption text-bone-2">archive</p>
          <h2 className="mt-3 font-serif text-[clamp(24px,2.8vw,36px)] font-light italic leading-[1.1] tracking-[-0.02em] text-bone-1/70">
            What you've laid to rest.
          </h2>
        </div>
        <span className="mono-caption tabular text-bone-2 transition-colors group-hover:text-bone-1">
          {kills.length} on record · {open ? "hide" : "open"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="graveyard-contents"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.7, ease: ease.editorial }}
            className="overflow-hidden"
          >
            <ul className="mt-12 space-y-px bg-bone-0/[0.04]">
              {kills.map((k, i) => (
                <Headstone key={`${k.ideaId}-${k.timestamp}-${i}`} record={k} index={i} />
              ))}
            </ul>

            <p className="mt-10 max-w-[60ch] font-serif italic text-[14.5px] leading-[1.55] text-bone-2/80">
              Killed ideas stay on record. The lesson is the inheritance —
              the scar is yours, the read is permanent.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function Headstone({ record, index }: { record: DecisionRecord; index: number }) {
  const ms = Date.parse(record.timestamp || record.createdAt || "")
  const days = Number.isFinite(ms) ? Math.floor((Date.now() - ms) / 86400000) : 9999
  const dateLabel = Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : "—"

  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.55 }}
      whileHover={{ opacity: 0.95 }}
      transition={{ duration: 0.6, delay: index * 0.04, ease: ease.editorial }}
      className="bg-ink-0"
    >
      <ChamberLink
        href={memoResultHref(record)}
        className="grid grid-cols-[1fr_auto] items-baseline gap-6 px-6 py-6 md:px-8 md:py-7"
      >
        <h3 className="font-serif text-[clamp(17px,1.7vw,22px)] font-light leading-snug tracking-[-0.01em] text-bone-1/85">
          {record.ideaTitle || record.summary || "Untitled brief"}
        </h3>

        <div className="flex flex-col items-end gap-1">
          <span className="mono-caption tabular text-verdict-kill/70">KILLED</span>
          <span className="mono-caption tabular text-bone-2/80">
            {days >= 9999 ? dateLabel : `${days}d ago · ${dateLabel}`}
          </span>
        </div>
      </ChamberLink>
    </motion.li>
  )
}
