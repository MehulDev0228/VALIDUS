"use client"

import { useEffect, useMemo, useState } from "react"
import { extractMemoProgressionSnapshot } from "@/lib/founder-memory/extract-memo-snapshot"
import { deriveExecutionTaskItems } from "@/lib/founder-memory/execution-tasks"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { FounderDecisionPanel } from "@/components/founder-decision-panel"
import { MemoFeedbackStrip } from "@/components/memo-feedback-strip"
import { MemoAtAGlance } from "@/components/memo-at-a-glance"
import { MemoResonanceLine } from "@/components/memo-resonance-line"
import { MemoProductSignals } from "@/components/memo-product-intelligence"
import { ReflectionPromptStrip } from "@/components/reflection-prompt-strip"
import { WhyVerdictPanel } from "@/components/why-verdict-panel"
import { useAuth } from "@/contexts/auth-context"
import { ideaKeyFromIdea } from "@/lib/founder-workflow/types"
import { buildWhyVerdictLines } from "@/lib/memo/why-verdict"

type Verdict = "BUILD" | "PIVOT" | "KILL"

export default function ValidationResultsPage() {
  const [results, setResults] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [reportViewStart] = useState(() => Date.now())
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("validationResults") : null
      if (stored) {
        setResults(JSON.parse(stored))
        try {
          void fetch("/api/metrics/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "activation_free_result", payload: {} }),
          })
        } catch {}
      }
    } catch {}
    setLoaded(true)
    return () => {
      const ms = Date.now() - reportViewStart
      try {
        void fetch("/api/metrics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "time_on_free_results", payload: { ms } }),
        })
      } catch {}
    }
  }, [reportViewStart])

  if (!loaded) return <PageShell />

  if (!results) {
    return (
      <PageShell>
        <div className="mx-auto flex h-[60vh] max-w-[640px] flex-col items-start justify-center px-6 md:px-10">
          <div className="mono-caption mb-4">No memo on file</div>
          <h2 className="font-serif text-[clamp(36px,4vw,52px)] leading-[1.1] tracking-[-0.025em]">
            Nothing to argue with yet.
          </h2>
          <p className="mt-4 max-w-[480px] text-[16px] leading-[1.6] text-bone-1">
            Submit an idea and the agents will assemble. The Final Judge does not improvise without a brief.
          </p>
          <div className="mt-8">
            <Link href="/dashboard/validate" className="tab-cta">
              <span>{microcopy.hero.ctaPrimary}</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  const free = results
  const isPremium = Boolean(free.tam_data)

  if (isPremium) {
    // Premium reports have their own dedicated page (/dashboard/premium-results).
    // Surface a hand-off for any historical premium objects that landed here.
    return (
      <PageShell>
        <div className="mx-auto max-w-[640px] px-6 py-32 md:px-10">
          <div className="mono-caption mb-4">Premium memo detected</div>
          <h2 className="font-serif text-[44px] leading-tight tracking-[-0.025em]">
            Your premium memo lives in a different room.
          </h2>
          <button
            type="button"
            onClick={() => router.push("/dashboard/premium-results")}
            className="tab-cta mt-8"
          >
            <span>Open premium memo</span>
            <span className="tab-cta-arrow">→</span>
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <FreeMemo free={free} />
    </PageShell>
  )
}

function PageShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <header className="sticky top-0 z-30 border-b border-bone-0/[0.06] bg-ink-0/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-2 w-2 bg-bone-0" />
            <span className="mono-caption text-bone-0">
              Future<span className="text-bone-1">/</span>Validate
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="mono-caption text-bone-1 hover:text-bone-0">
              home
            </Link>
            <Link href="/dashboard/validate" className="tab-cta">
              <span>{microcopy.results.submitNew}</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="pb-32">{children}</main>
    </div>
  )
}

function FreeMemo({ free }: { free: any }) {
  const { user } = useAuth()
  const score: number = free.score ?? 0
  const opportunityScore: number = (() => {
    if (typeof free.opportunityScore === "number") return Math.max(0, Math.min(100, free.opportunityScore))
    return Math.max(0, Math.min(100, Math.round(score * 10)))
  })()
  const classification: string = free.classification ?? "possible"
  const verdict: Verdict =
    free.finalVerdict?.decision ??
    (classification === "high" ? "BUILD" : classification === "low" ? "KILL" : "PIVOT")
  const [runIdeaId, setRunIdeaId] = useState<string | null>(null)

  useEffect(() => {
    try {
      setRunIdeaId(typeof window !== "undefined" ? localStorage.getItem("ideaId") : null)
    } catch {
      setRunIdeaId(null)
    }
  }, [])

  useEffect(() => {
    if (!user?.id || !runIdeaId) return
    try {
      const day = new Date().toISOString().slice(0, 10)
      const key = `fv_result_trust_${runIdeaId}_${day}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
      void fetch("/api/founder-memory/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "results_view" }),
      })
    } catch {}
  }, [user?.id, runIdeaId])
  const tone =
    verdict === "BUILD"
      ? "text-verdict-build"
      : verdict === "PIVOT"
      ? "text-verdict-pivot"
      : "text-verdict-kill"
  const confidence = Math.round(((free.finalVerdict?.confidence ?? 0.6) as number) * 100)
  const memoId = useMemoId(free)
  const date = new Date().toISOString().slice(0, 10)
  const country = free.ideaContext?.country || free.researchInsights?.[0]?.country || ""
  const industry = free.ideaContext?.market?.split(/[,;]/)[0]?.trim() || free.metadata?.industry || ""

  const works =
    free.finalVerdict?.ifWorksBecause ||
    free.finalVerdict?.topReasons?.[0] ||
    "you force a wedge that buyers pay for before you scale anything else."
  const fails =
    free.finalVerdict?.ifFailsBecause ||
    free.topRisks?.[0] ||
    "distribution never compounds and the product never becomes the default."

  const ideaTitleForExec = free.idea_title || free.ideaContext?.coreIdea || "Idea on file"
  const ideaExcerptForExec = useMemo(() => {
    const parts = [
      free.ideaContext?.problem,
      free.ideaContext?.targetUser,
      free.ideaContext?.market,
      free.ideaContext?.coreIdea,
    ].filter(Boolean)
    return parts.join("\n").slice(0, 1200)
  }, [free.ideaContext])

  const memoIdeaKey = useMemo(
    () =>
      ideaKeyFromIdea({
        title: free.idea_title || free.ideaContext?.coreIdea || "Idea on file",
        description: ideaExcerptForExec || (typeof free.ideaContext?.coreIdea === "string" ? free.ideaContext.coreIdea : ""),
      }),
    [free.idea_title, free.ideaContext?.coreIdea, ideaExcerptForExec],
  )

  const operatorTasks = useMemo(() => {
    const snap = extractMemoProgressionSnapshot(free, verdict)
    return deriveExecutionTaskItems(snap, {
      ideaTitle: ideaTitleForExec,
      ideaExcerpt: ideaExcerptForExec,
      verdict,
    })
  }, [free, verdict, ideaTitleForExec, ideaExcerptForExec])

  const partnerLead = useMemo(() => {
    const brutal =
      typeof free.finalVerdict?.brutalSummary === "string" ? free.finalVerdict.brutalSummary.trim() : ""
    const r0 = free.finalVerdict?.topReasons?.[0]
    const accent = typeof r0 === "string" ? r0.trim() : ""
    if (brutal && accent) {
      return `${brutal} ${accent}`
    }
    if (brutal) return brutal
    if (accent) return accent
    return `The court read this as ${verdict}. Pair the score with the falsification plan instead of debating the tone.`
  }, [free.finalVerdict, verdict])

  const glanceSummary = useMemo(() => {
    const brutal =
      typeof free.finalVerdict?.brutalSummary === "string" ? free.finalVerdict.brutalSummary.trim() : ""
    const base = brutal.length > 0 ? brutal : partnerLead.trim()
    return base.length > 480 ? `${base.slice(0, 478)}…` : base
  }, [free.finalVerdict?.brutalSummary, partnerLead])

  const keyWarnings = useMemo(() => {
    const merged = [
      ...((free.finalVerdict?.topRisks as string[] | undefined) ?? []),
      ...((free.whyThisIdeaWillLikelyFail as string[] | undefined) ?? []),
      ...((free.topRisks as string[] | undefined) ?? []),
    ]
      .filter((x): x is string => typeof x === "string" && Boolean(x.trim()))
      .map((x) => x.trim())
    const unique: string[] = []
    const seen = new Set<string>()
    for (const line of merged) {
      const key = line.slice(0, 80).toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(line)
    }
    return unique.slice(0, 5)
  }, [free])

  const whyVerdictLines = useMemo(() => buildWhyVerdictLines(free, verdict), [free, verdict])

  const resonanceLine = useMemo(() => {
    const rs = free.finalVerdict?.topReasons as string[] | undefined
    if (!rs?.length) return ""
    const a = typeof rs[1] === "string" ? rs[1].trim() : ""
    const b = typeof rs[0] === "string" ? rs[0].trim() : ""
    const pick = (a.length > 28 ? a : "") || b
    if (!pick) return ""
    return pick.length > 520 ? `${pick.slice(0, 518)}…` : pick
  }, [free.finalVerdict?.topReasons])

  return (
    <MemoProductSignals ideaId={runIdeaId} ideaKey={memoIdeaKey} verdict={verdict}>
    <article className="mx-auto max-w-[1200px] px-6 pt-12 md:px-10">
      {/* Memo header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: ease.editorial }}
        className="grid grid-cols-12 items-end gap-6 border-b border-bone-0/[0.06] pb-8"
      >
        <div className="col-span-12 md:col-span-7">
          <div className="mono-caption tabular flex flex-wrap items-center gap-3">
            <span>{memoId}</span>
            <span className="h-px w-4 bg-bone-0/20" />
            <span>{date}</span>
            {industry && <span className="h-px w-4 bg-bone-0/20" />}
            {industry && <span>{industry}</span>}
            {country && <span className="h-px w-4 bg-bone-0/20" />}
            {country && <span>{country}</span>}
          </div>
          <h1 className="mt-4 font-serif text-[clamp(32px,4vw,52px)] leading-[1.1] tracking-[-0.025em]">
            {free.idea_title || free.ideaContext?.coreIdea || "Idea on file"}
          </h1>
        </div>
        <div className="col-span-12 mono-caption text-bone-2 md:col-span-5 md:text-right">
          {microcopy.results.headerConfidential}
        </div>
      </motion.header>

      <MemoAtAGlance summaryLine={glanceSummary} topPressure={keyWarnings[0] ?? null} />
      {resonanceLine ? (
        <MemoResonanceLine eyebrow={microcopy.results.resonanceEyebrow} line={resonanceLine} />
      ) : null}

      {free.metadata?.degraded ? (
        <aside
          className="mt-8 bg-gradient-to-r from-verdict-pivot/8 to-transparent px-4 py-4 md:px-6"
          role="status"
        >
          <div className="mono-caption text-verdict-pivot">Reduced pipeline</div>
          <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-bone-1">
            {free.metadata.degradedReason?.trim() || microcopy.results.degradedLead}
          </p>
        </aside>
      ) : null}

      {/* Verdict slab + Score */}
      <section className="mt-10 grid grid-cols-12 gap-6 md:mt-12 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: ease.editorial }}
          className="col-span-12 md:col-span-7"
          data-pi-section="verdict_slab"
        >
          <div className="mono-caption">{microcopy.results.finalVerdictLabel}</div>
          <div className={`mt-3 font-sans text-[clamp(80px,12vw,180px)] font-semibold leading-none tracking-[-0.045em] ${tone}`}>
            <LetterReveal text={verdict} />
          </div>
          <p className="mt-6 max-w-[560px] font-serif text-[clamp(20px,2vw,28px)] italic leading-snug text-bone-0">
            {free.finalVerdict?.brutalSummary || verdictFallback(classification)}
          </p>

          <div className="mt-8 flex items-center gap-6">
            <div>
              <div className="mono-caption">{microcopy.results.confidenceLabel}</div>
              <div className="tabular mt-2 font-sans text-[28px] font-medium leading-none tracking-[-0.02em]">
                {confidence}<span className="text-bone-2">%</span>
              </div>
            </div>
            <div className="h-12 w-px bg-bone-0/10" />
            <div>
              <div className="mono-caption">stance</div>
              <div className="mt-2 font-sans text-[16px] text-bone-0">{microcopy.results.stanceLine}</div>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: ease.editorial }}
          className="col-span-12 md:col-span-5"
        >
          <div className="border border-bone-0/10 p-6 md:p-8">
            <div className="mono-caption">{microcopy.results.scoreLabel}</div>
            <div className="tabular mt-3 font-sans text-[clamp(56px,6vw,88px)] font-medium leading-none tracking-[-0.03em]">
              {opportunityScore}<span className="text-bone-2 text-[0.5em]">/100</span>
            </div>
            <div className="mt-8 space-y-4">
              {(free.scoreBreakdown
                ? [
                    { k: "Market", v: free.scoreBreakdown.market / 10 },
                    { k: "Competition", v: free.scoreBreakdown.competition / 10 },
                    { k: "Monetization", v: free.scoreBreakdown.monetization / 10 },
                    { k: "Execution", v: free.scoreBreakdown.execution / 10 },
                    { k: "Founder fit", v: free.scoreBreakdown.founderFit / 10 },
                  ]
                : [
                    { k: "Market", v: 0.6 },
                    { k: "Defensibility", v: 0.55 },
                    { k: "Distribution", v: 0.5 },
                  ]
              ).map(({ k, v }) => (
                <div key={k}>
                  <div className="mono-caption mb-1 flex justify-between">
                    <span>{k}</span>
                    <span className="tabular text-bone-0">{Math.round((v as number) * 100)}</span>
                  </div>
                  <div className="h-px bg-bone-0/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(v as number) * 100}%` }}
                      transition={{ duration: 0.9, ease: ease.editorial }}
                      className="h-px bg-bone-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="mt-12 space-y-8 md:mt-16">
        <div
          id="memo-partner-read"
          className="bg-gradient-to-b from-bone-0/[0.035] to-transparent px-6 py-8 scroll-mt-28 md:p-12"
          data-pi-section="partner_read"
        >
          <div className="mono-caption text-bone-2">{microcopy.results.partnerEyebrow}</div>
          <p className="mt-4 max-w-[720px] font-serif text-[clamp(20px,2.2vw,28px)] leading-snug tracking-[-0.015em] text-bone-0">
            {partnerLead}
          </p>
          {keyWarnings.length > 0 ? (
            <div className="mt-8">
              <div className="mono-caption text-bone-2">{microcopy.results.pressuresInlineEyebrow}</div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {keyWarnings.map((w, i) => (
                  <li
                    key={i}
                    className="bg-bone-0/[0.04] px-3 py-2 text-[13px] leading-snug text-bone-1"
                  >
                    {w.length > 220 ? `${w.slice(0, 218)}…` : w}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <WhyVerdictPanel lines={whyVerdictLines} />
      </section>

      {/* Diptych: works / fails */}
      <section className="mt-16 grid grid-cols-1 gap-6 md:gap-px md:bg-bone-0/[0.05] md:grid-cols-2" data-pi-section="works_fails">
        <DiptychPanel label={microcopy.results.works} body={works} />
        <DiptychPanel label={microcopy.results.fails} body={fails} dim />
      </section>

      {/* Final Judge Reasoning */}
      {free.finalVerdict?.topReasons?.length ? (
        <Section
          eyebrow={microcopy.results.judgeEyebrow}
          title={microcopy.results.judgeTitle}
          className="mt-14 md:mt-20"
          dataPiSection="judge_reasons"
        >
          <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
            {free.finalVerdict.topReasons.map((r: string, i: number) => (
              <li key={i} className="grid grid-cols-[60px_1fr] items-baseline gap-6 py-5">
                <span className="mono-caption tabular">{`R${String(i + 1).padStart(2, "0")}`}</span>
                <span className="text-[16px] leading-snug text-bone-0">{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Decoded context */}
      {free.ideaContext && (
        <Section
          eyebrow={microcopy.results.decodedEyebrow}
          title={microcopy.results.decodedTitle}
          className="mt-14 md:mt-20"
          dataPiSection="decoded_brief"
        >
          <dl className="grid grid-cols-1 gap-px bg-bone-0/[0.04] md:grid-cols-2">
            <ContextRow label="Problem" value={free.ideaContext.problem} />
            <ContextRow label="Target user" value={free.ideaContext.targetUser} />
            <ContextRow label="Market" value={free.ideaContext.market} />
            <ContextRow label="Core idea" value={free.ideaContext.coreIdea} />
          </dl>
        </Section>
      )}

      {/* Research */}
      {(free.researchInsights ?? []).length > 0 && (
        <Section
          eyebrow={microcopy.results.researchEyebrow}
          title={microcopy.results.researchTitle}
          className="mt-14 md:mt-20"
          dataPiSection="research"
        >
          <ul className="space-y-px bg-bone-0/[0.04]">
            {free.researchInsights.slice(0, 4).map((insight: any, i: number) => (
              <li key={i} className="grid grid-cols-[60px_1fr] gap-6 bg-ink-0 p-6">
                <span className="mono-caption tabular">{`I${String(i + 1).padStart(2, "0")}`}</span>
                <div className="space-y-2">
                  <div className="font-sans text-[18px] font-medium text-bone-0">
                    {insight.title || insight.trendObservation}
                  </div>
                  <p className="text-[14px] leading-relaxed text-bone-1">
                    <span className="text-bone-2">Why it matters — </span>
                    {insight.whyItMatters || insight.implication}
                  </p>
                  <p className="text-[14px] leading-relaxed text-bone-1">
                    <span className="text-bone-2">Strategic implication — </span>
                    {insight.strategicImplication || insight.implication}
                  </p>
                  {insight.opportunityAngle && (
                    <p className="text-[14px] leading-relaxed text-bone-1">
                      <span className="text-bone-2">Opportunity — </span>
                      {insight.opportunityAngle}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Agent panels */}
      {(free.agentInsights ?? []).length > 0 && (
        <details
          id="fv-memo-specialist-details"
          className="group mt-14 bg-gradient-to-b from-bone-0/[0.03] to-transparent md:mt-20 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-6 md:px-8">
            <div>
              <div className="mono-caption text-bone-2">{microcopy.results.agents}</div>
              <div className="mt-2 font-serif text-[clamp(22px,2.4vw,32px)] leading-tight tracking-[-0.02em]">
                {microcopy.results.contrastingDetailTitle}
              </div>
              <p className="mt-2 max-w-[640px] text-[13px] text-bone-2">{microcopy.results.agentsLead}</p>
            </div>
            <span className="mono-caption text-bone-2 transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="border-t border-bone-0/[0.05] px-3 pb-8 pt-4 md:px-6">
            <ul className="grid grid-cols-1 gap-px bg-bone-0/[0.05] md:grid-cols-2">
              {free.agentInsights.map((a: any, i: number) => (
                <AgentPanel key={i} agent={a} index={i} />
              ))}
            </ul>
          </div>
        </details>
      )}

      {/* Risks */}
      <Section
        eyebrow={microcopy.results.risks}
        title={microcopy.results.riskSectionTitle}
        className="mt-14 md:mt-20"
        dataPiSection="risks"
      >
        <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
          {(free.whyThisIdeaWillLikelyFail ?? free.topRisks ?? [])
            .slice(0, 5)
            .map((r: string, i: number) => (
              <li key={i} className="grid grid-cols-[60px_1fr] items-baseline gap-6 py-5">
                <span className="mono-caption tabular text-bone-2">{`F${String(i + 1).padStart(2, "0")}`}</span>
                <span className="text-[16px] leading-snug text-bone-0">{r}</span>
              </li>
            ))}
        </ul>
      </Section>

      {/* Plan */}
      <Section
        eyebrow={microcopy.results.plan}
        title={microcopy.results.planSectionTitle}
        className="mt-14 md:mt-20"
        dataPiSection="plan_48h"
      >
        <PlanTable plan={free.executionPlanner48h} fallback={free.fastestWayToProveWrong48h ?? free.executionPlan} />
      </Section>

      <Section
        eyebrow={microcopy.results.executionEyebrow}
        title={microcopy.results.executionTitle}
        className="mt-14 md:mt-20"
        dataPiSection="execution_tasks"
      >
        <p className="mb-6 max-w-[720px] text-[14px] leading-relaxed text-bone-2">{microcopy.results.executionLead}</p>
        <ol className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
          {operatorTasks.map((t) => (
            <li key={t.taskId} className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[88px_1fr] md:gap-6">
              <span className="mono-caption text-bone-2">{t.anchor}</span>
              <span className="text-[15px] leading-snug text-bone-0">{t.text}</span>
            </li>
          ))}
        </ol>
        <p className="mono-caption mt-6 text-bone-2">
          <Link href="/dashboard/founder" className="underline-offset-4 hover:text-bone-0">
            {microcopy.results.archiveLink}
          </Link>
        </p>
      </Section>

      <section className="mt-16 space-y-10">
        <ReflectionPromptStrip
          ideaId={runIdeaId}
          ideaKey={memoIdeaKey}
          verdict={verdict}
          trigger="post_memo_read"
        />
        <MemoFeedbackStrip ideaId={runIdeaId} verdict={verdict} />
      </section>

      {/* Founder Decision Panel — keeps existing FDS workflow */}
      <Section
        eyebrow={microcopy.results.decisionSystemEyebrow}
        title={microcopy.results.decisionSystemTitle}
        className="mt-14 md:mt-20"
      >
        <FounderDecisionPanel validation={free} />
      </Section>

      <div className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-bone-0/10 pt-8">
        <div className="mono-caption text-bone-2">
          Memo {memoId} · Filed {date} · private synthesis.
        </div>
        <Link href="/dashboard/validate" className="tab-cta">
          <span>{microcopy.results.submitNew}</span>
          <span className="tab-cta-arrow">→</span>
        </Link>
      </div>
    </article>
    </MemoProductSignals>
  )
}

function verdictFallback(c: string) {
  if (c === "high")
    return "Momentum matters less than falsification — pick two sharp tests before more polish."
  if (c === "low") return "The shape on file strains against incentive reality — rethink who pays and why."
  return "Either clarify the wedge you will die on or widen the aperture before time compounds the wrong bet."
}

function DiptychPanel({ label, body, dim }: { label: string; body: string; dim?: boolean }) {
  return (
    <div className="bg-bone-0/[0.025] p-8 md:p-10">
      <div className="mono-caption">{label}</div>
      <p className={`mt-4 font-serif text-[clamp(22px,2.4vw,32px)] italic leading-snug ${dim ? "text-bone-1" : "text-bone-0"}`}>
        {body}
      </p>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  children,
  className,
  dataPiSection,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  className?: string
  /** Product intelligence: dwell + revisit signals */
  dataPiSection?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, ease: ease.editorial }}
      className={className ?? "mt-20 md:mt-28"}
      {...(dataPiSection ? { "data-pi-section": dataPiSection } : {})}
    >
      <header className="mb-8 grid grid-cols-12 items-end gap-6">
        <div className="col-span-12 md:col-span-3">
          <div className="mono-caption">{eyebrow}</div>
        </div>
        <h2 className="col-span-12 font-serif text-[clamp(28px,3vw,44px)] leading-[1.1] tracking-[-0.02em] md:col-span-9">
          {title}
        </h2>
      </header>
      {children}
    </motion.section>
  )
}

function ContextRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-ink-0/80 p-6">
      <div className="mono-caption">{label}</div>
      <div className="mt-3 text-[15px] leading-snug text-bone-0">{value || "—"}</div>
    </div>
  )
}

function AgentPanel({ agent, index }: { agent: any; index: number }) {
  const lean = (agent.verdictLean as Verdict) || "PIVOT"
  const tone =
    lean === "BUILD" ? "text-verdict-build" : lean === "KILL" ? "text-verdict-kill" : "text-verdict-pivot"
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.05 * index, ease: ease.editorial }}
      className="bg-ink-0 p-6 md:p-8"
    >
      <header className="flex items-center justify-between">
        <span className="mono-caption tabular">
          {String(index + 1).padStart(2, "0")} — {agent.agent}
        </span>
        <span className={`font-sans text-[14px] font-medium ${tone}`}>{lean}</span>
      </header>
      <ul className="mt-5 space-y-3">
        {(agent.insights ?? []).slice(0, 3).map((p: string, i: number) => (
          <li key={i} className="flex gap-3 text-[14px] leading-snug text-bone-0">
            <span className="select-none text-bone-2">—</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {agent.confidence != null && (
        <div className="mt-5 border-t border-bone-0/[0.06] pt-3">
          <div className="mono-caption flex justify-between">
            <span>confidence</span>
            <span className="tabular">{Math.round(agent.confidence * 100)}%</span>
          </div>
        </div>
      )}
    </motion.li>
  )
}

function PlanTable({ plan, fallback }: { plan?: any[]; fallback?: string[] }) {
  const rows: Array<{ day: string; action: string; success?: string; fail?: string }> = (() => {
    if (Array.isArray(plan) && plan.length > 0) {
      return plan.map((s: any) => ({
        day: s.day || `Day ${s.order || ""}`.trim(),
        action: s.action || s.task || "",
        success: s.successIf,
        fail: s.failIf,
      }))
    }
    if (Array.isArray(fallback)) {
      return fallback.map((line, i) => ({
        day: `Day ${i < 3 ? 1 : 2}`,
        action: line,
      }))
    }
    return []
  })()

  if (rows.length === 0) {
    return <p className="mono-caption text-bone-2">No plan supplied. Pick three falsification tests and time-box.</p>
  }

  return (
    <div className="border border-bone-0/10">
      <div className="mono-caption tabular grid grid-cols-[80px_1fr_1fr_1fr] gap-4 border-b border-bone-0/10 bg-bone-0/[0.02] px-6 py-3">
        <span>Day</span>
        <span>Action</span>
        <span>Success if</span>
        <span>Fail if</span>
      </div>
      <ul className="divide-y divide-bone-0/[0.06]">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[80px_1fr_1fr_1fr] items-baseline gap-4 px-6 py-5 text-[14px] leading-snug"
          >
            <span className="mono-caption tabular">{r.day}</span>
            <span className="text-bone-0">{r.action}</span>
            <span className="text-verdict-build/90">{r.success || "—"}</span>
            <span className="text-verdict-kill/90">{r.fail || "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LetterReveal({ text }: { text: string }) {
  const toneClass =
    text === "BUILD"
      ? "text-verdict-build"
      : text === "PIVOT"
        ? "text-verdict-pivot"
        : "text-verdict-kill"
  const toneDelay = Math.min(0.42, Math.max(0.2, text.length * 0.07))
  return (
    <span className={`inline-flex text-bone-0 ${toneClass}`}>
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, color: ["rgb(245 245 242)", "rgb(245 245 242)", "currentColor"] }}
          transition={{ duration: 0.26, delay: 0.06 * i, ease: ease.editorial, color: { delay: toneDelay } }}
          className="inline-block"
        >
          {c}
        </motion.span>
      ))}
    </span>
  )
}

function useMemoId(free: any) {
  return useMemo(() => {
    const seed = (free?.idea_title || free?.ideaContext?.coreIdea || "FV").toString()
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    return `FV-${String((h % 9000) + 1000)}`
  }, [free])
}
