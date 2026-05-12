"use client"

import { motion } from "framer-motion"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { ease } from "@/lib/motion"
import { deriveCognition, type ConvictionTrend } from "@/lib/cognition"
import { ChamberLink } from "@/components/chamber"
import { memoResultHref } from "@/lib/founder-workflow/memo-links"
import type { DecisionRecord } from "@/lib/founder-workflow/types"
import { cn } from "@/lib/utils"

function OppSpark({ score, verdict }: { score: number; verdict: DecisionRecord["verdict"] }) {
  const s = Math.max(0, Math.min(100, Math.round(score)))
  const jitter = ((recordHash(score) % 17) - 8) / 100
  const data = [
    { v: Math.max(0, Math.min(100, s * (0.78 + jitter))) },
    { v: Math.max(0, Math.min(100, s * (0.86 - jitter))) },
    { v: Math.max(0, Math.min(100, s * (0.9 + jitter * 0.5))) },
    { v: Math.max(0, Math.min(100, s * 0.95)) },
    { v: Math.max(0, Math.min(100, s)) },
    { v: Math.max(0, Math.min(100, s * (0.98 - jitter))) },
  ]

  const stroke =
    verdict === "BUILD"
      ? "rgb(var(--verdict-build))"
      : verdict === "KILL"
        ? "rgb(var(--verdict-kill))"
        : "rgb(var(--verdict-pivot))"

  return (
    <div className="hidden h-[40px] w-[72px] sm:block" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.65}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function recordHash(seed: number): number {
  const x = seed * 92837111 + 482711
  return Math.abs(Math.floor(Math.sin(x) * 10000))
}

/**
 * ThoughtStream — the core dashboard ledger.
 *
 * Each reflection is a cognition artifact, not a row. It carries:
 *   - title (editorial serif)
 *   - emotional state chip (subtle, never loud)
 *   - conviction trend glyph (rising / holding / softening / broken)
 *   - unresolved-tension marker (an ember dot if true)
 *   - contradiction marker (when verdict has flipped on this idea)
 *   - last revisit timestamp + revisit count
 *   - a single-line cognition pressure note
 *
 * The whole stream is intentionally NOT a card grid. It's a vertical thread
 * with hairline dividers — you scroll through your own thinking.
 */
export function ThoughtStream({ records }: { records: DecisionRecord[] }) {
  return (
    <ul className="divide-y divide-bone-0/[0.08]">
      {records.map((r, i) => (
        <ThoughtArtifact key={`${r.ideaId}-${r.timestamp}-${i}`} record={r} peers={records} index={i} />
      ))}
    </ul>
  )
}

function ThoughtArtifact({
  record,
  peers,
  index,
}: {
  record: DecisionRecord
  peers: DecisionRecord[]
  index: number
}) {
  const shape = deriveCognition(record, peers)
  const verdict = record.verdict

  const verdictTone =
    verdict === "BUILD"
      ? "text-verdict-build"
      : verdict === "KILL"
      ? "text-verdict-kill"
      : "text-verdict-pivot"

  const verdictDot =
    verdict === "BUILD"
      ? "bg-verdict-build"
      : verdict === "KILL"
      ? "bg-verdict-kill"
      : "bg-verdict-pivot"

  // Killed reflections drift toward the graveyard tone — not in this stream.
  // (The ledger only renders non-killed reflections; KILLs live in the graveyard.)

  const date = relativeDate(record)
  const score = record.opportunityScore != null ? Math.round(record.opportunityScore) : null

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.04, 0.4), ease: ease.editorial }}
      className="group relative"
    >
      <ChamberLink
        href={memoResultHref(record)}
        className={cn(
          "group/card grid grid-cols-[12px_1fr_auto] items-baseline gap-6 border-l-[3px] pl-5 transition-[transform,box-shadow,background-color] duration-500 hover:bg-bone-0/[0.04] hover:shadow-[0_14px_40px_-34px_rgb(23_26_31_/_0.12)] md:gap-8 md:hover:scale-[1.005]",
          index === 0 ? "py-10 md:py-11" : "py-6 md:py-7",
          verdict === "BUILD" && "border-verdict-build",
          verdict === "KILL" && "border-verdict-kill",
          verdict === "PIVOT" && "border-verdict-pivot",
        )}
      >
        {/* Verdict dot — the anchor */}
        <span className="relative inline-flex h-3 w-3 items-center justify-center self-start pt-2">
          <span className={`h-1.5 w-1.5 rounded-full ${verdictDot}`} />
          {shape.unresolved && (
            <span
              className="absolute -inset-0.5 rounded-full border border-ember/30 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              aria-hidden
            />
          )}
        </span>

        {/* Body */}
        <div className="min-w-0">
          {/* Title */}
          <h3
            className={cn(
              "font-serif font-light leading-[1.18] tracking-[-0.015em] text-bone-0",
              index === 0
                ? "text-[clamp(22px,2.45vw,34px)]"
                : "text-[clamp(19px,2vw,26px)]",
            )}
          >
            {record.ideaTitle || record.summary || "Untitled brief"}
          </h3>

          {/* Cognition signal row — state, conviction, contradiction, revisits */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <StateChip state={shape.stateLabel} />
            <ConvictionGlyph trend={shape.conviction} />
            {shape.contradiction && (
              <span className="mono-caption text-ash">contradiction on record</span>
            )}
            {shape.revisitCount > 1 && (
              <span className="mono-caption tabular text-bone-2">{shape.revisitCount} revisits</span>
            )}
          </div>

          {/* Pressure note — quiet, italic, never preachy */}
          {shape.pressure && (
            <p className="mt-3 max-w-[60ch] font-serif italic text-[14.5px] leading-[1.55] text-bone-1/85">
              {shape.pressure}
            </p>
          )}
        </div>

        {/* Right edge — verdict, score, date. Tabular for stillness. */}
        <div className="flex flex-col items-end gap-1.5 self-start pt-1.5">
          <span className={`mono-caption tabular ${verdictTone}`}>{verdict}</span>
          {score != null ? (
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
              <OppSpark score={score} verdict={verdict} />
              <span className="mono-caption tabular text-bone-2">{score}/100</span>
            </div>
          ) : null}
          <span className="mono-caption tabular text-bone-2">{date}</span>
        </div>
      </ChamberLink>
    </motion.li>
  )
}

/**
 * StateChip — emotional state in a single restrained line.
 * No background fill. No border. Just the words, with an ember dash before.
 */
function StateChip({ state }: { state: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-px w-3 bg-ember/45" />
      <span className="mono-caption text-ember/85">{state}</span>
    </span>
  )
}

/**
 * ConvictionGlyph — a single character + word communicating direction.
 * Quiet. Never an icon. Founders read words, not symbols.
 */
function ConvictionGlyph({ trend }: { trend: ConvictionTrend }) {
  const map: Record<ConvictionTrend, { mark: string; word: string; tone: string }> = {
    rising:    { mark: "↗", word: "rising",    tone: "text-verdict-build/70" },
    holding:   { mark: "—", word: "holding",   tone: "text-bone-1" },
    softening: { mark: "↘", word: "softening", tone: "text-bone-2" },
    broken:    { mark: "✕", word: "broken",    tone: "text-ash/80" },
  }
  const m = map[trend]
  return (
    <span className={`mono-caption tabular ${m.tone}`}>
      conviction {m.mark} {m.word}
    </span>
  )
}

/* -------------------------------------------------------------------------- */

function relativeDate(r: DecisionRecord): string {
  const ms = Date.parse(r.timestamp || r.createdAt || "")
  if (!Number.isFinite(ms)) return "—"
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(ms).toISOString().slice(0, 10)
}
