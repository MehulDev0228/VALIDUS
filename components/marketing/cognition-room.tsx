"use client"

import { motion } from "framer-motion"
import { ease } from "@/lib/motion"

/**
 * CognitionRoom — sells the emotional environment.
 *
 * Three columns of operational reality + a centerpiece showing what writing
 * inside VERDIKT actually feels like. The page changes pace here:
 * dense in the previous sections, breathing here. That contrast is the
 * point — rhythm creates retention.
 */
export function CognitionRoom() {
  return (
    <section
      id="cognition-room"
      data-section="room"
      className="relative isolate overflow-hidden bg-ink-0 py-32 md:py-48"
    >
      {/* Centered ember halo — faint, grounding */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60vw 50vh at 50% 50%, rgb(216 163 109 / 0.05), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Header — centered, contemplative */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.0, ease: ease.editorial }}
          className="mx-auto max-w-[700px] text-center"
        >
          <p className="mono-caption text-ember/80">06 — the room</p>
          <h2 className="mt-5 font-serif font-light text-bone-0 text-[clamp(36px,5vw,64px)] leading-[1.05] tracking-[-0.03em]">
            Quieter than the internet.
            <br />
            <em className="italic">By design.</em>
          </h2>
          <p className="mt-8 font-serif text-[clamp(17px,1.5vw,20px)] leading-[1.6] text-bone-1">
            VERDIKT isn't a feed. There's no audience, no streak, no
            reaction count. It's a private surface for thinking &mdash; with
            structure waiting in the wings when you want pressure.
          </p>
        </motion.div>

        {/* The chamber surface — the writing space, rendered */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.1, ease: ease.editorial }}
          className="mx-auto mt-20 max-w-[920px]"
        >
          <ChamberPreview />
        </motion.div>

        {/* Three pillars — separated by hairlines, no card chrome */}
        <div className="mt-24 grid grid-cols-1 gap-12 md:mt-32 md:grid-cols-3 md:gap-0">
          <Pillar
            n="01"
            label="private to you"
            title="No audience. No metrics."
            body="Reflections live behind your account, end-to-end. Nothing is shared, summarized for marketing, or shown to anyone else. Ever."
          />
          <Pillar
            n="02"
            label="calm by structure"
            title="One brief. One read."
            body="No infinite scroll, no chat history. Each reflection is a single document. You leave with a frame &mdash; not a tab full of unread takes."
            divider
          />
          <Pillar
            n="03"
            label="on the record"
            title="Decisions stay legible."
            body="Every memo joins your archive with verdict, score, contradictions, and the brief that produced it. Six months later, you can still read why you decided."
            divider
          />
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  ChamberPreview                                                            */
/* -------------------------------------------------------------------------- */

function ChamberPreview() {
  return (
    <div className="floating-panel relative overflow-hidden rounded-sm p-8 md:p-12">
      {/* Top meta line — the founder's anchor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-ember breathe" />
          <span className="mono-caption text-bone-2">file a new thought</span>
        </div>
        <span className="mono-caption tabular text-bone-2">⌘⏎ when ready</span>
      </div>

      {/* Body — the writing surface */}
      <p className="mt-12 font-serif font-light text-[clamp(22px,2.6vw,36px)] leading-[1.3] tracking-[-0.02em] text-bone-1/70">
        <em className="italic">say the quiet part plainly &mdash;</em>
        <br />
        what's pulling at you right now?
      </p>

      {/* Soft cursor sitting under the prompt */}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        className="mt-3 inline-block h-[1.2em] w-[3px] bg-bone-0/60 align-middle"
      />

      {/* Footer line */}
      <div className="mt-16 flex items-center justify-between border-t border-bone-0/[0.08] pt-5">
        <span className="mono-caption tabular text-bone-2">428 chars · drafted at 09:14</span>
        <span className="mono-caption tabular text-ember/70">compose read →</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pillar                                                                    */
/* -------------------------------------------------------------------------- */

function Pillar({
  n,
  label,
  title,
  body,
  divider,
}: {
  n: string
  label: string
  title: string
  body: string
  divider?: boolean
}) {
  return (
    <div className={`relative px-2 md:px-10 ${divider ? "md:border-l md:border-bone-0/[0.08]" : ""}`}>
      <span className="font-serif italic text-[clamp(48px,4vw,64px)] leading-none text-ember/30">
        {n}
      </span>
      <p className="mt-6 mono-caption text-ember/80">{label}</p>
      <h3 className="mt-3 font-serif font-light text-[clamp(20px,2vw,26px)] leading-[1.2] tracking-[-0.02em] text-bone-0">
        {title}
      </h3>
      <p className="mt-4 font-serif text-[15.5px] leading-[1.6] text-bone-1">
        {body}
      </p>
    </div>
  )
}
