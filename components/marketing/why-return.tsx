"use client"

import { motion } from "framer-motion"
import { ease, timing } from "@/lib/motion"

/**
 * WhyReturn — the moat, told as three movements with different compositions.
 *
 * Movement A — TRAJECTORY      a wide unboxed line chart, headline overlapping
 * Movement B — ASSUMPTIONS     a hairline-divided strip, no cards
 * Movement C — PATTERNS        three asymmetric editorial quotes, staggered
 *
 * Each movement uses a DIFFERENT compositional system so the section
 * doesn't read as a single uniform pattern. The reader feels the page
 * shift as they pass through.
 */
export function WhyReturn() {
  return (
    <section
      id="founder-memory"
      data-section="why-return"
      className="relative isolate bg-ink-0 py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Section eyebrow + headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end md:gap-10"
        >
          <div className="md:col-span-7">
            <p className="marketing-label">History</p>
            <h2 className="marketing-title mt-4 font-sans">
              See verdict drift across reruns — when you save them.
            </h2>
          </div>
          <div className="md:col-span-5 md:pb-2">
            <p className="marketing-body">
              Signed-in users keep a timeline of memos per idea. Helpful when
              you change pricing, ICP, or wedge and want before/after without
              digging through chats.
            </p>
          </div>
        </motion.div>

        <MovementTrajectory />
        <MovementAssumptions />
        <MovementPatterns />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="mt-24 max-w-[68ch] text-[15.5px] leading-[1.6] text-bone-1"
        >
          Pattern notes are illustrative — shipped product surfaces may summarize differently.
        </motion.p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Movement A — Trajectory                                                   */
/* -------------------------------------------------------------------------- */

function MovementTrajectory() {
  const points: Array<{ d: string; v: number; verdict: "BUILD" | "PIVOT" | "KILL" }> = [
    { d: "Mar 14", v: 38, verdict: "PIVOT" },
    { d: "Mar 28", v: 52, verdict: "PIVOT" },
    { d: "Apr 12", v: 41, verdict: "PIVOT" },
    { d: "Apr 26", v: 58, verdict: "PIVOT" },
    { d: "May 03", v: 64, verdict: "BUILD" },
    { d: "May 08", v: 72, verdict: "BUILD" },
  ]

  const w = 100
  const h = 30
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map((p) => h - (p.v / 100) * h * 0.85 - 1.5)
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ")
  const dArea = `${d} L ${w} ${h} L 0 ${h} Z`

  return (
    <div className="relative mt-20 md:mt-24">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: timing.section.mid, ease: ease.editorial }}
        className="max-w-[680px]"
      >
        <p className="mono-caption text-bone-2">conviction trajectory</p>
            <h3 className="mt-3 font-sans font-medium text-[clamp(19px,2vw,24px)] leading-[1.25] tracking-[-0.015em] text-bone-0">
            Example: six revisits over eight weeks as the wedge narrowed.
          </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: timing.section.mid, ease: ease.editorial }}
        className="relative mt-8"
      >
        <svg
          viewBox={`0 0 ${w} ${h + 4}`}
          className="h-[200px] w-full md:h-[260px]"
          preserveAspectRatio="none"
        >
          {/* Faint area fill — gives the chart presence without a border */}
          <defs>
            <linearGradient id="why-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(14 131 157)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="rgb(14 131 157)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={dArea}
            fill="url(#why-area)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: timing.section.mid, delay: 0.3, ease: ease.editorial }}
          />
          {/* Gridlines */}
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1={0}
              x2={w}
              y1={h - (y / 100) * h * 0.85 - 1.5}
              y2={h - (y / 100) * h * 0.85 - 1.5}
              stroke="rgb(23 26 31 / 0.06)"
              strokeWidth={0.15}
            />
          ))}
          {/* Path */}
          <motion.path
            d={d}
            fill="none"
            stroke="rgb(14 131 157)"
            strokeWidth={0.45}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: timing.section.max + 0.2, ease: ease.editorial }}
          />
          {/* Points */}
          {points.map((p, i) => (
            <motion.circle
              key={p.d}
              cx={xs[i]}
              cy={ys[i]}
              r={0.7}
              fill={
                p.verdict === "BUILD"
                  ? "rgb(126 154 108)"
                  : p.verdict === "PIVOT"
                  ? "rgb(216 163 109)"
                  : "rgb(154 95 82)"
              }
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: timing.tiny.max, delay: 0.85 + i * 0.05, ease: ease.editorial }}
            />
          ))}
        </svg>

        {/* X-axis */}
        <div className="mt-3 grid grid-cols-6 text-[10px] tracking-[0.06em] uppercase text-bone-2 tabular">
          {points.map((p) => (
            <span key={p.d} className="text-center">
              {p.d}
            </span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: timing.section.min, delay: 1.05, ease: ease.editorial }}
          className="absolute right-0 top-[-4px] hidden max-w-[180px] text-right md:block"
        >
          <p className="mono-caption text-bone-2">last revisit</p>
          <p className="mt-1 text-[13.5px] leading-[1.4] text-bone-1">
            contradiction resolved, conviction holds
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Movement B — Assumption ledger (hairline strip, no cards)                 */
/* -------------------------------------------------------------------------- */

function MovementAssumptions() {
  const rows: Array<{
    assumption: string
    from: string
    to: string
    tone: "softened" | "broken" | "rising"
  }> = [
    { assumption: "buyer is enterprise legal IT",         from: "Mar 14", to: "Apr 26", tone: "broken" },
    { assumption: "$199/mo procurement-friendly price",   from: "Mar 14", to: "Apr 12", tone: "softened" },
    { assumption: "solo lawyers will pay below procurement", from: "Apr 12", to: "now", tone: "rising" },
    { assumption: "case-state primitives are the wedge",     from: "May 03", to: "now", tone: "rising" },
  ]

  return (
    <div className="mt-24 md:mt-32">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: timing.section.mid, ease: ease.editorial }}
        className="flex items-end justify-between"
      >
        <div className="max-w-[560px]">
          <p className="mono-caption text-bone-2">assumption ledger</p>
          <h3 className="mt-3 font-sans font-medium text-[clamp(19px,2vw,24px)] leading-[1.25] tracking-[-0.015em] text-bone-0">
            Four assumptions on file. Two broken, two holding.
          </h3>
        </div>
        <span className="hidden mono-caption tabular text-bone-2 md:inline">over 8 weeks</span>
      </motion.div>

      <ul className="mt-8 divide-y divide-bone-0/[0.08] border-y border-bone-0/[0.08]">
        {rows.map((r, i) => (
          <motion.li
            key={r.assumption}
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: timing.section.min, delay: i * 0.04, ease: ease.editorial }}
            className="grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-5 md:grid-cols-[40px_1fr_140px_120px] md:gap-8"
          >
            <span className="mono-caption tabular text-bone-2">{String(i + 1).padStart(2, "0")}</span>
            <p
              className={`text-[15.5px] leading-[1.45] ${
                r.tone === "broken"
                  ? "text-bone-2 line-through decoration-ash/50 decoration-[1px]"
                  : "text-bone-0"
              }`}
            >
              {r.assumption}
            </p>
            <span className="hidden mono-caption tabular text-bone-2 md:inline">
              {r.from} → {r.to}
            </span>
            <span
              className={`mono-caption tabular ${
                r.tone === "rising"
                  ? "text-verdict-build"
                  : r.tone === "softened"
                  ? "text-verdict-pivot"
                  : "text-ash"
              }`}
            >
              {r.tone === "rising" ? "↗ rising" : r.tone === "softened" ? "↘ softened" : "✕ broken"}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Movement C — Recurring patterns (asymmetric editorial quotes)             */
/* -------------------------------------------------------------------------- */

function MovementPatterns() {
  const patterns = [
    {
      label: "scope creep",
      seen: "across 4 ideas",
      body:
        "Your first-pass framing tends to be enterprise-grade. By revisit 3, you narrow to a single segment. The archive flags this on file 02.",
    },
    {
      label: "pricing optimism",
      seen: "across 3 ideas",
      body:
        "Your initial price points sit roughly 2.1x higher than what holds after market contact. The archive lowers the next initial estimate accordingly.",
    },
    {
      label: "buyer misidentification",
      seen: "across 2 ideas",
      body:
        "You tend to name the budget-holder as the buyer. Your wedges actually target the user. Flagged as a soft assumption on every new memo.",
    },
  ]

  return (
    <div className="mt-24 md:mt-32">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: timing.section.mid, ease: ease.editorial }}
        className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end md:gap-10"
      >
        <div className="md:col-span-6">
          <p className="mono-caption text-bone-2">recurring blind spots</p>
          <h3 className="mt-3 font-sans font-medium text-[clamp(19px,2vw,24px)] leading-[1.25] tracking-[-0.015em] text-bone-0">
            Patterns the archive keeps flagging.
          </h3>
        </div>
        <div className="md:col-span-6 md:pb-1">
          <p className="text-[15.5px] leading-[1.6] text-bone-1">
            Three illustrative patterns surfaced across reruns on file.
            Each one is flagged on every new memo.
          </p>
        </div>
      </motion.div>

      {/* Aligned grid, no offset staggers, no decorative numerals */}
      <ul className="mt-10 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-10 md:gap-y-0">
        {patterns.map((p, i) => (
          <motion.li
            key={p.label}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: timing.section.min, delay: i * 0.05, ease: ease.editorial }}
            className="relative md:border-l md:border-bone-0/[0.08] md:pl-6"
          >
            <div className="flex items-baseline justify-between">
              <p className="mono-caption text-bone-2">{p.label}</p>
              <p className="mono-caption tabular text-bone-2">{p.seen}</p>
            </div>
            <p className="mt-3 text-[15px] leading-[1.55] text-bone-0">{p.body}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
