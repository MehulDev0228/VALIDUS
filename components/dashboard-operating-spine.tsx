"use client"

import Link from "next/link"
import { microcopy } from "@/lib/microcopy"
import type { BlindSpotObservation } from "@/lib/founder-memory/types"
import type { ExecutionWorkspacePayload } from "@/lib/founder-memory/execution-workspace"
import type { ProgressionWorkspacePayload } from "@/lib/founder-memory/bundle"

function formatIsoDay(iso: string): string {
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? "—" : new Date(ms).toISOString().slice(0, 10)
}

/**
 * Quiet founder-home spine — recalls what is live without analytics theater.
 */
export function DashboardOperatingSpine({
  journeyLines,
  execution,
  progression,
  blindSpots,
}: {
  journeyLines: string[]
  execution: ExecutionWorkspacePayload | null
  progression: ProgressionWorkspacePayload | null
  blindSpots: BlindSpotObservation[]
}) {
  const prog = progression
  const unresolved = (() => {
    if (!prog?.assumptionBoard?.length) return 0
    let n = 0
    for (const b of prog.assumptionBoard) for (const r of b.rows) if (r.status === "unresolved") n++
    return n
  })()

  const activeLines = journeyLines.slice(0, 4)
  const topPack = execution?.taskPacks?.[0]
  const activeTasks = topPack?.tasks.slice(0, 3) ?? []
  const experiments = (prog?.lineages ?? [])
    .flatMap((L) => L.experimentsPreview.map((e) => ({ label: L.label, ...e })))
    .slice(0, 4)
  const shifts = (prog?.whatChanged ?? []).slice(0, 2)
  const spots = blindSpots.slice(0, 2)
  const s = microcopy.dashboard.spine

  return (
    <section className="mt-12 bg-gradient-to-b from-bone-0/[0.035] to-transparent px-5 py-10 md:px-10 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bone-0/[0.05] pb-6">
        <div>
          <p className="mono-caption text-bone-2">{s.eyebrow}</p>
          <h2 className="mt-3 font-serif text-[clamp(24px,2.8vw,36px)] leading-tight tracking-[-0.02em]">
            {s.title}
          </h2>
        </div>
        <Link href="/dashboard/founder" className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0">
          {s.openFull}
        </Link>
      </header>

      {activeLines.length > 0 && (
        <div className="mt-8 space-y-3 border-b border-bone-0/[0.05] pb-8">
          <div className="mono-caption text-bone-2">{s.continuityEyebrow}</div>
          <ul className="space-y-2 text-[15px] leading-relaxed text-bone-0">
            {activeLines.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="select-none text-bone-2">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div>
          <div className="mono-caption text-bone-2">{s.executionEyebrow}</div>
          {activeTasks.length === 0 ? (
            <p className="mt-3 text-[14px] text-bone-1">{s.executionEmpty}</p>
          ) : (
            <div className="mt-3">
              <p className="mono-caption text-bone-2">{topPack!.threadLabel}</p>
              <ol className="mt-4 space-y-3 text-[14px] leading-snug text-bone-0">
                {activeTasks.map((t) => (
                  <li key={t.taskId} className="flex gap-2">
                    <span className="text-bone-2">·</span>
                    <span>{t.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div>
          <div className="mono-caption text-bone-2">{s.assumptionsEyebrow}</div>
          <p className="mt-3 text-[clamp(40px,5vw,56px)] font-sans font-medium tabular leading-none tracking-[-0.03em]">
            {unresolved}
            <span className="ml-2 font-serif text-[18px] italic text-bone-2">unresolved</span>
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-bone-1">{s.assumptionsSub}</p>
        </div>
      </div>

      {experiments.length > 0 && (
        <div className="mt-10 border-t border-bone-0/[0.05] pt-8">
          <div className="mono-caption text-bone-2">{s.experimentsEyebrow}</div>
          <ul className="mt-4 space-y-3 text-[14px] text-bone-1">
            {experiments.map((e, i) => (
              <li key={`${e.at}-${i}`}>
                <span className="tabular text-bone-2">{formatIsoDay(e.at)}</span>
                <span className="text-bone-2"> · </span>
                <span className="text-bone-0">{e.label}</span>
                <span className="text-bone-2"> — </span>
                {e.actionSnippet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {shifts.length > 0 && (
        <div className="mt-10 border-t border-bone-0/[0.05] pt-8">
          <div className="mono-caption text-bone-2">{s.shiftsEyebrow}</div>
          <ul className="mt-4 space-y-3 text-[14px] text-bone-1">
            {shifts.map((w) => (
              <li key={`${w.ideaKey}-${w.newerAt}`}>
                <span className="text-bone-0">{w.label}</span>
                <span className="text-bone-2"> · </span>
                {formatIsoDay(w.olderAt)} → {formatIsoDay(w.newerAt)}
                <span className="text-bone-2"> · </span>
                {w.verdictShift}
              </li>
            ))}
          </ul>
        </div>
      )}

      {spots.length > 0 && (
        <div className="mt-10 border-t border-bone-0/[0.05] pt-8">
          <div className="mono-caption text-bone-2">{s.blindEyebrow}</div>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-bone-1">
            {spots.map((b) => (
              <li key={b.id} className="border-l-2 border-bone-0/15 pl-4">
                {b.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
