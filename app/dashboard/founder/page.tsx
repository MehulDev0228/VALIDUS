"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardNav } from "@/components/dashboard-nav"
import { ease } from "@/lib/motion"
import { useAuth } from "@/contexts/auth-context"
import type { FounderMemoryBundle, ProgressionWorkspacePayload } from "@/lib/founder-memory/bundle"
import type { ExecutionWorkspacePayload } from "@/lib/founder-memory/execution-workspace"
import type { TimelineEvent } from "@/lib/founder-memory/types"
import { FounderWorkspaceExecution } from "@/components/founder-workspace-execution"
import { microcopy } from "@/lib/microcopy"

type FounderMemoryClient = Omit<FounderMemoryBundle, "timeline">

function formatDay(iso: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return "—"
  return new Date(ms).toISOString().slice(0, 10)
}

function eventLabel(e: TimelineEvent): string {
  switch (e.kind) {
    case "validation_verdict":
      return `${e.verdict} · ${e.ideaTitle.slice(0, 72)}${e.ideaTitle.length > 72 ? "…" : ""}`
    case "experiment":
      return `Experiment · ${e.actionTaken.slice(0, 64)}${e.actionTaken.length > 64 ? "…" : ""}`
    case "pivot_note":
      return `Note · ${e.body.length > 72 ? `${e.body.slice(0, 72)}…` : e.body}`
    case "report_feedback":
      return `Feedback · ${e.tags.join(", ")}`
    case "execution_plan":
      return `Execution plan · ${e.tasks.length} task${e.tasks.length === 1 ? "" : "s"}`
    case "execution_checkin":
      return `Check-in · ${e.status.replace(/_/g, " ")}`
    case "founder_reflection":
      return `Reflection · ${e.promptLabel}`
  }
}

const emptyExecutionPayload = (): ExecutionWorkspacePayload => ({
  taskPacks: [],
  theoryVsReality: [],
  validationEvolution: [],
  executionPatterns: [],
  recent: { windowDays: 14, checkinTotal: 0, byStatus: {} },
})

const emptyProgression = (): ProgressionWorkspacePayload => ({
  lineages: [],
  whatChanged: [],
  assumptionBoard: [],
  progressionPatterns: [],
})

export default function FounderWorkspacePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<FounderMemoryClient | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?next=/dashboard/founder")
  }, [user, loading, router])

  const loadBundle = useCallback(() => {
    if (!user) return
    fetch("/api/founder-memory")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success && j.profile) {
          setData({
            timelinePreview: j.timelinePreview || [],
            profile: j.profile,
            blindSpots: j.blindSpots || [],
            feedbackSummary: j.feedbackSummary || { totals: {}, feedbackEvents: 0, lastSevenDays: 0 },
            storeMeta: j.storeMeta,
            progression: (j.progression as ProgressionWorkspacePayload) ?? emptyProgression(),
            execution: (j.execution as ExecutionWorkspacePayload) ?? emptyExecutionPayload(),
            onboarding: j.onboarding ?? null,
            trustSignals: j.trustSignals ?? null,
            journeyLines: Array.isArray(j.journeyLines) ? j.journeyLines : [],
          })
        } else setLoadErr("Could not open founder file.")
      })
      .catch(() => setLoadErr("Could not open founder file."))
  }, [user])

  useEffect(() => {
    loadBundle()
  }, [loadBundle])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="grid h-[60vh] place-items-center">
          <span className="mono-caption tabular text-bone-2">{microcopy.dashboard.loading}</span>
        </main>
      </div>
    )
  }

  const prog = data?.progression ?? emptyProgression()

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />

      <main className="mx-auto max-w-[900px] px-6 pb-32 pt-12 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.editorial }}
          className="border-b border-bone-0/[0.08] pb-10"
        >
          <p className="mono-caption text-bone-2">{microcopy.founder.eyebrow}</p>
          <h1 className="mt-4 font-serif text-[clamp(32px,4vw,48px)] leading-tight tracking-[-0.02em]">
            {microcopy.founder.title}
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-bone-1">{microcopy.founder.lead}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard/validate" className="tab-cta">
              <span>{microcopy.founder.fileMemo}</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
            <Link href="/dashboard" className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0">
              {microcopy.founder.backHome}
            </Link>
          </div>
        </motion.header>

        {loadErr && (
          <p className="mono-caption mt-10 border-l-2 border-verdict-kill pl-4 text-verdict-kill">{loadErr}</p>
        )}

        {data && (
          <>
            <section className="mt-16">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">{microcopy.founder.lineagesTitle}</h2>
              <p className="mono-caption mt-2 text-bone-2">{microcopy.founder.lineagesSubtitle}</p>
              {prog.lineages.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">No filings on file yet, or lineage keys unavailable from older saves.</p>
              ) : (
                <ul className="mt-8 space-y-10">
                  {prog.lineages.map((L) => (
                    <li key={L.ideaKey} className="border border-bone-0/10 bg-ink-1/25 p-6 md:p-8">
                      <div className="flex flex-wrap items-baseline justify-between gap-4">
                        <div>
                          <div className="mono-caption text-bone-2">{L.filingCount} filing{L.filingCount === 1 ? "" : "s"}</div>
                          <h3 className="mt-1 font-serif text-[20px] leading-snug text-bone-0">{L.label}</h3>
                        </div>
                        <span className="mono-caption tabular text-bone-2">
                          {formatDay(L.oldestAt)} · {formatDay(L.newestAt)}
                        </span>
                      </div>
                      <p className="mono-caption mt-4 text-bone-2">
                        Latest {L.latestVerdict}
                        {L.latestScore != null ? ` · ${L.latestScore}/100` : ""}
                        {` · ${L.experimentCount} logged experiment${L.experimentCount === 1 ? "" : "s"}`}
                      </p>
                      {L.versions.length > 0 && (
                        <ol className="mt-4 space-y-2 border-l border-bone-0/15 pl-4">
                          {L.versions.map((v, idx) => (
                            <li key={`${v.at}-${idx}`} className="text-[13px] leading-snug text-bone-1">
                              <span className="tabular text-bone-2">{formatDay(v.at)}</span> · {v.verdict}
                              {v.opportunityScore != null ? ` · ${v.opportunityScore}/100` : ""}{" "}
                              <span className="text-bone-2">{v.ideaIdTail}</span>
                              {v.hasMemoSnapshot ? " · snapshot captured" : ""}
                            </li>
                          ))}
                        </ol>
                      )}
                      {L.experimentsPreview.length > 0 && (
                        <div className="mt-6">
                          <div className="mono-caption text-bone-2">Experiment residue</div>
                          <ul className="mt-2 space-y-2 text-[13px] text-bone-1">
                            {L.experimentsPreview.map((ex, i) => (
                              <li key={`${ex.at}-${i}`}>
                                <span className="tabular text-bone-2">{formatDay(ex.at)}</span> — {ex.actionSnippet}{" "}
                                <span className="text-bone-2">→ {ex.outcomeSnippet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-20">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">What shifted between memos</h2>
              <p className="mono-caption mt-2 text-bone-2">Diff of risks & dependencies when snapshots exist for successive filings.</p>
              {prog.whatChanged.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">Re-file the same wedge with richer context — the next pass will bracket what moved.</p>
              ) : (
                <div className="mt-8 space-y-10">
                  {prog.whatChanged.map((w) => (
                    <article key={`${w.ideaKey}-${w.newerAt}`} className="border border-bone-0/10 p-6 md:p-8">
                      <header className="border-b border-bone-0/10 pb-4">
                        <h3 className="font-serif text-[18px] text-bone-0">{w.label}</h3>
                        <p className="mono-caption mt-2 text-bone-2">
                          {formatDay(w.olderAt)} vs {formatDay(w.newerAt)} · {w.verdictShift}
                          {w.scoreDelta ? ` · ${w.scoreDelta}` : ""}
                        </p>
                      </header>
                      <div className="mt-4 grid gap-6 md:grid-cols-2">
                        <div>
                          <div className="mono-caption text-verdict-build">Pressure eased</div>
                          <ul className="mt-2 space-y-2 text-[14px] text-bone-1">
                            {w.improved.length === 0 ? <li className="text-bone-2">—</li> : w.improved.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="mono-caption text-verdict-kill">Pressure increased</div>
                          <ul className="mt-2 space-y-2 text-[14px] text-bone-1">
                            {w.worsened.length === 0 ? <li className="text-bone-2">—</li> : w.worsened.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {w.stillOpen.length > 0 && (
                        <div className="mt-6 border-t border-bone-0/10 pt-4">
                          <div className="mono-caption text-bone-2">Still unresolved</div>
                          <ul className="mt-2 space-y-2 text-[14px] text-bone-1">
                            {w.stillOpen.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {w.assumptionShifts.length > 0 && (
                        <div className="mt-6 border-t border-bone-0/10 pt-4">
                          <div className="mono-caption text-bone-2">Assumption deltas</div>
                          <ul className="mt-2 space-y-2 text-[14px] text-bone-1">
                            {w.assumptionShifts.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-20">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Assumptions vs reality</h2>
              <p className="mono-caption mt-2 text-bone-2">
                Taken from decoded brief assumptions; states heuristically read against experiments you logged — not legal truth.
              </p>
              {prog.assumptionBoard.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">Memos missing structured gaps, or experiments not yet anchored to this wedge.</p>
              ) : (
                <div className="mt-8 space-y-10">
                  {prog.assumptionBoard.map((b) => (
                    <div key={b.ideaKey} className="border border-bone-0/10 p-6 md:p-8">
                      <h3 className="font-serif text-[18px] text-bone-0">{b.label}</h3>
                      <ul className="mt-4 divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
                        {b.rows.map((r, i) => (
                          <li key={`${r.text}-${i}`} className="grid gap-2 py-4 md:grid-cols-[120px_1fr] md:gap-6">
                            <span
                              className={`mono-caption ${
                                r.status === "validated"
                                  ? "text-verdict-build"
                                  : r.status === "disproven"
                                    ? "text-verdict-kill"
                                    : "text-bone-2"
                              }`}
                            >
                              {r.status}
                            </span>
                            <div>
                              <div className="text-[14px] text-bone-0">{r.text}</div>
                              <div className="mt-2 text-[13px] leading-relaxed text-bone-2">{r.evidence}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-20">
              <FounderWorkspaceExecution execution={data.execution ?? emptyExecutionPayload()} onRefresh={loadBundle} />
            </div>

            <section className="mt-20">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Progression reflections</h2>
              <p className="mono-caption mt-2 text-bone-2">Sequence patterns across filings — no psychological labels.</p>
              {prog.progressionPatterns.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">More filings and dated experiments widen this aperture.</p>
              ) : (
                <ul className="mt-8 space-y-4">
                  {prog.progressionPatterns.map((p) => (
                    <li key={p.id} className="border-l-2 border-bone-0/25 pl-4">
                      <p className="text-[15px] leading-relaxed text-bone-0">{p.text}</p>
                      <p className="mono-caption mt-2 text-bone-2">Based on · {p.basis}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-20">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Emerging profile</h2>
              <p className="mono-caption mt-2 text-bone-2">Updated {formatDay(data.profile.computedAt)} · from behavior</p>
              <dl className="mt-8 grid gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-2">
                <Cell k="Archetype" v={data.profile.founderArchetype.replace(/_/g, " ")} />
                <Cell k="Risk posture" v={data.profile.riskPosture.replace(/_/g, " ")} />
                <Cell k="BUILD / PIVOT / KILL" v={`${data.profile.verdictCounts.BUILD} · ${data.profile.verdictCounts.PIVOT} · ${data.profile.verdictCounts.KILL}`} />
                <Cell k="Re-files (same idea id churn)" v={String(data.profile.revalidationCount)} />
                <Cell k="Ideas clustering on" v={data.profile.recurringIdeaTags.join(", ") || "—"} />
                <Cell k="Signal balance" v={data.profile.asymmetryPainBalance.replace(/_/g, " ")} />
                <Cell k="Operational realism (from experiments)" v={data.profile.operationalRealism} />
              </dl>
            </section>

            <section className="mt-16">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Blind spots to watch</h2>
              <p className="mono-caption mt-2 text-bone-2">
                Quiet hypotheses — grounded in repeats across your filings and logs.
              </p>
              {data.blindSpots.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">Not enough history yet. A few memos plus experiments sharpen this list.</p>
              ) : (
                <ul className="mt-8 space-y-4">
                  {data.blindSpots.map((b) => (
                    <li key={b.id} className="border-l-2 border-bone-0/20 pl-4">
                      <p className="text-[15px] leading-relaxed text-bone-0">{b.text}</p>
                      <p className="mono-caption mt-2 text-bone-2">{b.confidence} confidence · {b.basis.replace(/_/g, " ")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-16">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Execution notes</h2>
              {(data.profile.recurringExecutionWeaknesses.length === 0 &&
                data.profile.recurringGtmMistakes.length === 0) ? (
                <p className="mt-6 text-[15px] text-bone-1">Log experiments under a memo — patterns surface after a handful of structured entries.</p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {[...data.profile.recurringExecutionWeaknesses, ...data.profile.recurringGtmMistakes].map((line, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-bone-1">
                      <span className="select-none text-bone-2">—</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-16">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Memo reactions</h2>
              <p className="mono-caption mt-2 text-bone-2">
                {data.feedbackSummary.feedbackEvents} total · {data.feedbackSummary.lastSevenDays} in the last seven days
              </p>
              {Object.keys(data.feedbackSummary.totals).length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">When you tap calibration on a results page, it lands here.</p>
              ) : (
                <ul className="mt-6 mono-caption tabular text-bone-1">
                  {Object.entries(data.feedbackSummary.totals).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b border-bone-0/10 py-2">
                      <span>{k}</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-16 pb-16">
              <h2 className="font-serif text-[22px] tracking-[-0.02em]">Raw timeline spine</h2>
              <p className="mono-caption mt-2 text-bone-2">{data.storeMeta.events} events · last edited {formatDay(data.storeMeta.updatedAt)}</p>
              {data.timelinePreview.length === 0 ? (
                <p className="mt-6 text-[15px] text-bone-1">Nothing persisted yet — file a memo while signed in.</p>
              ) : (
                <ul className="mt-8 divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
                  {data.timelinePreview.map((e) => (
                    <li key={e.id} className="grid grid-cols-1 gap-1 py-4 md:grid-cols-[100px_1fr] md:gap-6">
                      <span className="mono-caption tabular text-bone-2">{formatDay(e.at)}</span>
                      <span className="text-[14px] leading-snug text-bone-0">{eventLabel(e)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-ink-0 p-5 md:p-6">
      <div className="mono-caption text-bone-2">{k}</div>
      <div className="mt-2 text-[15px] capitalize text-bone-0">{v}</div>
    </div>
  )
}
