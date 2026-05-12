"use client"

import { useEffect, useMemo, useState } from "react"
import { extractMemoProgressionSnapshot } from "@/lib/founder-memory/extract-memo-snapshot"
import { deriveExecutionTaskItems } from "@/lib/founder-memory/execution-tasks"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { MemoViralToolbar } from "@/components/memo-viral-toolbar"
import { Challenge48hPanel } from "@/components/challenge-48h-panel"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { FounderDecisionPanel } from "@/components/founder-decision-panel"
import { MemoFeedbackStrip } from "@/components/memo-feedback-strip"
import { MemoAtAGlance } from "@/components/memo-at-a-glance"
import { MemoResonanceLine } from "@/components/memo-resonance-line"
import { MemoProductSignals } from "@/components/memo-product-intelligence"
import { ScoreGauge } from "@/components/score-gauge"
import { RadarBreakdown, type RadarDims } from "@/components/radar-breakdown"
import { ContrarianView, type DissentEntry } from "@/components/contrarian-view"
import { ReflectionPromptStrip } from "@/components/reflection-prompt-strip"
import { WhyVerdictPanel } from "@/components/why-verdict-panel"
import { useAuth } from "@/contexts/auth-context"
import { ideaKeyFromIdea } from "@/lib/founder-workflow/types"
import { buildWhyVerdictLines } from "@/lib/memo/why-verdict"
import { useChamberSettle } from "@/components/chamber"
import { ideaInputFromFreeValidation } from "@/lib/validation/idea-input-from-results"

type Verdict = "BUILD" | "PIVOT" | "KILL"

export function ValidationResultsExperience() {
  const [results, setResults] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [reportViewStart] = useState(() => Date.now())
  const router = useRouter()
  const searchParams = useSearchParams()
  useChamberSettle()

  useEffect(() => {
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

  useEffect(() => {
    let cancelled = false

    async function load() {
      const runParam = searchParams.get("run")

      if (runParam) {
        try {
          const r = await fetch(`/api/validation-run?id=${encodeURIComponent(runParam)}`, {
            credentials: "same-origin",
          })
          if (r.ok && !cancelled) {
            const data = await r.json()
            if (data?.success && data.validation_results) {
              setResults(data.validation_results)
              try {
                localStorage.setItem("validationResults", JSON.stringify(data.validation_results))
                if (data.idea_id) localStorage.setItem("ideaId", data.idea_id)
                const brief = ideaInputFromFreeValidation(data.validation_results as Record<string, unknown>)
                localStorage.setItem("lastIdeaInput", JSON.stringify(brief))
              } catch {}
              try {
                void fetch("/api/metrics/event", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: "activation_free_result", payload: { source: "server_run" } }),
                })
              } catch {}
              if (!cancelled) setLoaded(true)
              return
            }
          }
        } catch {}
      }

      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("validationResults") : null
        if (stored && !cancelled) {
          const parsed = JSON.parse(stored) as Record<string, unknown>
          setResults(parsed)
          try {
            const brief = ideaInputFromFreeValidation(parsed)
            localStorage.setItem("lastIdeaInput", JSON.stringify(brief))
          } catch {}
          try {
            void fetch("/api/metrics/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: "activation_free_result", payload: { source: "local_fallback" } }),
            })
          } catch {}
        }
      } catch {}
      if (!cancelled) setLoaded(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  if (!loaded) return <PageShell />

  if (!results) {
    return (
      <PageShell>
        <div className="mx-auto flex h-[60vh] max-w-[640px] flex-col items-start justify-center px-6 md:px-10">
          <div className="marketing-label mb-4 text-ember/80">No memo loaded</div>
          <h2 className="font-serif text-[clamp(36px,4vw,52px)] leading-[1.1] tracking-[-0.025em]">
            Nothing to show yet.
          </h2>
          <p className="marketing-body mt-4 max-w-[480px]">
            Run Validate with a brief first. If you opened an old link, it may have expired — start a new run.
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
          <div className="marketing-label mb-4 text-ember/80">Premium memo</div>
          <h2 className="font-serif text-[44px] leading-tight tracking-[-0.025em]">
            This memo type opens elsewhere.
          </h2>
          <button
            type="button"
            onClick={() => router.push("/dashboard/premium-results")}
            className="tab-cta mt-8"
          >
            <span>Open premium read</span>
            <span className="tab-cta-arrow">→</span>
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <FreeMemo free={free} mode="full" />
    </PageShell>
  )
}

export function PageShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <header className="sticky top-0 z-30 border-b border-bone-0/[0.04] bg-ink-0/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-ember breathe" />
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

/** Full memo UI — used on `/dashboard/validate/results` and public `/memo/[id]` (mode=public). */
export function FreeMemo({ free, mode = "full" }: { free: any; mode?: "full" | "public" }) {
  const searchParams = useSearchParams()
  const runIdFromUrl = mode === "public" ? null : searchParams.get("run")
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

  const [verdictLanded, setVerdictLanded] = useState(false)
  const [showHold, setShowHold] = useState(() => mode !== "public")

  useEffect(() => {
    if (mode === "public") return
    const t1 = setTimeout(() => setVerdictLanded(true), 2000)
    const t2 = setTimeout(() => setShowHold(false), 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mode])

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
    return `This pass landed on ${verdict}. Use the score and 48h plan to disprove the idea cheaply — not to litigate tone.`
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

  const radarValues: RadarDims | null = useMemo(() => {
    const sb = free.scoreBreakdown as
      | {
          market?: number
          competition?: number
          monetization?: number
          execution?: number
          founderFit?: number
        }
      | undefined
    if (
      !sb ||
      typeof sb.market !== "number" ||
      typeof sb.competition !== "number" ||
      typeof sb.monetization !== "number" ||
      typeof sb.execution !== "number" ||
      typeof sb.founderFit !== "number"
    ) {
      return null
    }
    return {
      market: sb.market,
      competition: sb.competition,
      monetization: sb.monetization,
      execution: sb.execution,
      founderFit: sb.founderFit,
    }
  }, [free.scoreBreakdown])

  const annotatedRiskRows = useMemo(() => {
    const raw = free.annotatedRisks as Array<{ text: string; severity: string }> | undefined
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((r) => ({
        text: r.text,
        severity: (r.severity === "critical" || r.severity === "high" || r.severity === "medium"
          ? r.severity
          : "medium") as "critical" | "high" | "medium",
      }))
    }
    const flat = (free.whyThisIdeaWillLikelyFail ?? free.topRisks ?? []) as string[]
    return flat.slice(0, 5).map((text) => ({ text, severity: "medium" as const }))
  }, [free])

  const resonanceLine = useMemo(() => {
    const rs = free.finalVerdict?.topReasons as string[] | undefined
    if (!rs?.length) return ""
    const a = typeof rs[1] === "string" ? rs[1].trim() : ""
    const b = typeof rs[0] === "string" ? rs[0].trim() : ""
    const pick = (a.length > 28 ? a : "") || b
    if (!pick) return ""
    return pick.length > 520 ? `${pick.slice(0, 518)}…` : pick
  }, [free.finalVerdict?.topReasons])

  const inner = (
    <>
      {showHold && (
        <motion.div
          animate={{ opacity: verdictLanded ? 0 : 1 }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-0"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.02, 0] }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className={`absolute inset-0 ${tone.replace("text-", "bg-")}`}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`font-sans text-[clamp(80px,12vw,180px)] font-semibold tracking-[-0.045em] z-10 relative ${tone}`}
          >
            {verdict}
          </motion.div>
        </motion.div>
      )}
    <article className="mx-auto max-w-[1200px] px-6 pt-12 md:px-10">
      {/* Memo header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: ease.editorial }}
        className="grid grid-cols-12 items-end gap-6 border-b border-bone-0/[0.04] pb-8"
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
          {mode === "public" ? "Public share · read-only" : microcopy.results.headerConfidential}
        </div>
      </motion.header>

      {mode === "full" ? (
        <div className="mt-8">
          <MemoViralToolbar
            runId={runIdFromUrl}
            ideaTitle={free.idea_title || free.ideaContext?.coreIdea || "Idea"}
            memoPayload={free as Record<string, unknown>}
          />
        </div>
      ) : null}

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
          <div className="warm-surface rounded-sm border border-bone-0/[0.06] p-6 md:p-8">
            <div className="mono-caption">{microcopy.results.scoreLabel}</div>
            <div className="mt-6 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
              <ScoreGauge score={opportunityScore} verdict={verdict} size={120} />
              {radarValues ? (
                <div className="flex flex-1 flex-col items-center">
                  <RadarBreakdown values={radarValues} />
                  {free.scoreBreakdown?.weights ? (
                    <p className="mono-caption mt-2 max-w-[240px] text-center text-[11px] text-bone-2">
                      Weighted blend — dimensions are correlated, not independent votes.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="tabular font-sans text-[clamp(40px,5vw,72px)] font-medium leading-none tracking-[-0.03em]">
                  {opportunityScore}
                  <span className="text-bone-2 text-[0.5em]">/100</span>
                </div>
              )}
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
          className="warm-surface rounded-sm bg-gradient-to-b from-bone-0/[0.025] to-transparent px-6 py-8 scroll-mt-28 md:p-12"
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

      {free.agentDissent && Array.isArray(free.agentDissent) && free.agentDissent.length > 0 ? (
        <ContrarianView dissent={free.agentDissent as DissentEntry[]} />
      ) : null}

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
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-sans text-[18px] font-medium text-bone-0">
                      {insight.title || insight.trendObservation}
                    </div>
                    {insight.sourceType ? (
                      <span className="rounded-sm border border-bone-0/[0.12] bg-bone-0/[0.04] px-2 py-0.5 mono-caption text-[10px] uppercase tracking-wide text-bone-2">
                        {insight.sourceType === "nexus"
                          ? "Nexus"
                          : insight.sourceType === "kg"
                            ? "Knowledge graph"
                            : "Simulated"}
                      </span>
                    ) : null}
                    {typeof insight.confidence === "number" ? (
                      <span className="mono-caption tabular text-bone-2">
                        confidence {Math.round(insight.confidence * 100)}%
                      </span>
                    ) : null}
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
          {annotatedRiskRows.map((row, i: number) => {
            const bar =
              row.severity === "critical"
                ? "bg-verdict-kill"
                : row.severity === "high"
                  ? "bg-verdict-pivot"
                  : "bg-verdict-build/90"
            const pill =
              row.severity === "critical"
                ? "text-verdict-kill"
                : row.severity === "high"
                  ? "text-verdict-pivot"
                  : "text-verdict-build"
            return (
              <li key={i} className="grid grid-cols-[auto_1fr] items-start gap-4 py-5 md:gap-6">
                <span className={`mt-1.5 h-full min-h-[28px] w-1 shrink-0 rounded-full ${bar}`} aria-hidden />
                <div>
                  <span className={`mono-caption tabular uppercase tracking-wide ${pill}`}>{row.severity}</span>
                  <p className="mt-2 text-[16px] leading-snug text-bone-0">{row.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Comparables */}
      {(free.comparables ?? []).length > 0 && (
        <Section
          eyebrow="Analogues"
          title="Mechanism comparables"
          className="mt-14 md:mt-20"
          dataPiSection="comparables"
        >
          <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
            {(free.comparables as Array<{ name: string; reason: string; url?: string }>).map((c, i: number) => (
              <li key={i} className="py-6">
                <div className="font-sans text-[17px] font-semibold text-bone-0">{c.name}</div>
                <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-bone-1">{c.reason}</p>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mono-caption mt-3 inline-block text-ember/85 underline-offset-4 hover:text-ember"
                  >
                    Source ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      )}

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

      {mode === "full" ? (
        <Challenge48hPanel
          runId={runIdFromUrl}
          plan={free.executionPlanner48h}
          fallbackLines={free.fastestWayToProveWrong48h}
        />
      ) : null}

      {mode === "full" ? (
        <section className="mt-16 space-y-10">
          <ReflectionPromptStrip
            ideaId={runIdeaId}
            ideaKey={memoIdeaKey}
            verdict={verdict}
            trigger="post_memo_read"
          />
          <MemoFeedbackStrip ideaId={runIdeaId} verdict={verdict} />
        </section>
      ) : null}

      {mode === "full" ? (
        <Section
          eyebrow={microcopy.results.decisionSystemEyebrow}
          title={microcopy.results.decisionSystemTitle}
          className="mt-14 md:mt-20"
        >
          <FounderDecisionPanel validation={free} memoRunId={runIdFromUrl} />
        </Section>
      ) : null}

      <div className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-bone-0/10 pt-8">
        <div className="marketing-label text-bone-2">
          Memo {memoId} · {date} · {mode === "public" ? "shared read." : "private."}
        </div>
        <Link href="/dashboard/validate" className="tab-cta">
          <span>{mode === "public" ? "Run your own memo" : microcopy.results.submitNew}</span>
          <span className="tab-cta-arrow">→</span>
        </Link>
      </div>

      {mode === "full" ? <ReflectionPrompt /> : null}
    </article>
    </>
  )

  return mode === "public" ? (
    inner
  ) : (
    <MemoProductSignals ideaId={runIdeaId} ideaKey={memoIdeaKey} verdict={verdict}>
      {inner}
    </MemoProductSignals>
  )
}

/** Public share route — read-only shell + memo body (no founder panels). */
export function PublicMemoExperience({ free }: { free: Record<string, unknown> }) {
  return (
    <PageShell>
      <FreeMemo free={free} mode="public" />
    </PageShell>
  )
}

function ReflectionPrompt() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60000)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: ease.editorial }}
      className="mt-16 border-t border-bone-0/[0.06] pt-12 pb-24 text-center"
    >
      <p className="font-serif text-[20px] italic text-bone-1">
        What's the one thing you'd change about this brief right now?
      </p>
      <Link href="/dashboard/validate" className="tab-cta mt-6 inline-flex">
        <span>Refile with what you know now</span>
        <span className="tab-cta-arrow">→</span>
      </Link>
    </motion.div>
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
    <div className="warm-surface rounded-sm bg-bone-0/[0.02] p-8 md:p-10">
      <div className="mono-caption text-ember/50">{label}</div>
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
          <div className="mono-caption text-ember/50">{eyebrow}</div>
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

function agentAccent(agentName: string): { emoji: string; bar: string } {
  const n = `${agentName}`.toLowerCase()
  if (n.includes("market")) return { emoji: "◎", bar: "border-l-verdict-build/70" }
  if (n.includes("compet")) return { emoji: "⚔", bar: "border-l-verdict-pivot/70" }
  if (n.includes("monet")) return { emoji: "◆", bar: "border-l-ember/60" }
  if (n.includes("feasib") || n.includes("execution")) return { emoji: "⛭", bar: "border-l-bone-2/60" }
  if (n.includes("icp")) return { emoji: "◇", bar: "border-l-mist/70" }
  if (n.includes("risk") || n.includes("failure")) return { emoji: "⚠", bar: "border-l-verdict-kill/70" }
  if (n.includes("valid")) return { emoji: "✳", bar: "border-l-verdict-build/50" }
  return { emoji: "◈", bar: "border-l-bone-2/50" }
}

function AgentPanel({ agent, index }: { agent: any; index: number }) {
  const lean = (agent.verdictLean as Verdict) || "PIVOT"
  const tone =
    lean === "BUILD" ? "text-verdict-build" : lean === "KILL" ? "text-verdict-kill" : "text-verdict-pivot"
  const acc = agentAccent(String(agent.agent || ""))
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.05 * index, ease: ease.editorial }}
      className={`border-l-4 bg-ink-0 p-6 md:p-8 ${acc.bar}`}
    >
      <header className="flex items-center justify-between gap-3">
        <span className="mono-caption tabular">
          <span className="mr-2 inline-block w-6 text-center text-[14px] text-bone-2">{acc.emoji}</span>
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
  const [checked, setChecked] = useState<Record<number, boolean>>({})
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

  const doneCount = rows.filter((_, i) => checked[i]).length

  return (
    <div className="border border-bone-0/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone-0/10 bg-bone-0/[0.02] px-6 py-3">
        <span className="mono-caption tabular text-bone-2">
          Progress · {doneCount}/{rows.length}
        </span>
      </div>
      <div className="mono-caption tabular grid grid-cols-[52px_80px_1fr_1fr_1fr] gap-4 border-b border-bone-0/10 bg-bone-0/[0.02] px-6 py-3 md:grid-cols-[52px_88px_1fr_1fr_1fr]">
        <span className="sr-only">Done</span>
        <span>Day</span>
        <span>Action</span>
        <span>Success if</span>
        <span>Fail if</span>
      </div>
      <ul className="divide-y divide-bone-0/[0.06]">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[52px_80px_1fr_1fr_1fr] items-baseline gap-4 px-6 py-5 text-[14px] leading-snug md:grid-cols-[52px_88px_1fr_1fr_1fr]"
          >
            <button
              type="button"
              onClick={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
              aria-pressed={checked[i] ?? false}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-[12px] transition-colors ${
                checked[i]
                  ? "border-verdict-build bg-verdict-build/15 text-verdict-build"
                  : "border-bone-0/15 text-bone-2 hover:border-bone-0/25"
              }`}
            >
              {checked[i] ? "✓" : ""}
            </button>
            <span className="mono-caption tabular">{r.day}</span>
            <span className={`text-bone-0 ${checked[i] ? "text-bone-2 line-through" : ""}`}>{r.action}</span>
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
          animate={{ opacity: 1, y: 0, color: ["rgb(232 228 220)", "rgb(232 228 220)", "currentColor"] }}
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
