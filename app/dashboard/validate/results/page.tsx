"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { FounderDecisionPanel } from "@/components/founder-decision-panel"

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
              ledger
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
  const score: number = free.score ?? 0
  const opportunityScore: number = (() => {
    if (typeof free.opportunityScore === "number") return Math.max(0, Math.min(100, free.opportunityScore))
    return Math.max(0, Math.min(100, Math.round(score * 10)))
  })()
  const classification: string = free.classification ?? "possible"
  const verdict: Verdict =
    free.finalVerdict?.decision ??
    (classification === "high" ? "BUILD" : classification === "low" ? "KILL" : "PIVOT")
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

  return (
    <article className="mx-auto max-w-[1200px] px-6 pt-12 md:px-10">
      {/* Memo header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: ease.editorial }}
        className="grid grid-cols-12 items-end gap-6 border-b border-bone-0/10 pb-6"
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
          Confidential — founder copy
        </div>
      </motion.header>

      {/* Verdict slab + Score */}
      <section className="mt-12 grid grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: ease.editorial }}
          className="col-span-12 md:col-span-7"
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
              <div className="mt-2 font-sans text-[16px] text-bone-0">
                Decided. No hedging.
              </div>
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

      {/* Diptych: works / fails */}
      <section className="mt-16 grid grid-cols-1 gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-2">
        <DiptychPanel label={microcopy.results.works} body={works} />
        <DiptychPanel label={microcopy.results.fails} body={fails} dim />
      </section>

      {/* Final Judge Reasoning */}
      {free.finalVerdict?.topReasons?.length ? (
        <Section eyebrow="Judge reasoning" title="Top reasons on the record">
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
        <Section eyebrow="Decoded brief" title="What you actually said">
          <dl className="grid grid-cols-1 gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-2">
            <ContextRow label="Problem" value={free.ideaContext.problem} />
            <ContextRow label="Target user" value={free.ideaContext.targetUser} />
            <ContextRow label="Market" value={free.ideaContext.market} />
            <ContextRow label="Core idea" value={free.ideaContext.coreIdea} />
          </dl>
        </Section>
      )}

      {/* Research */}
      {(free.researchInsights ?? []).length > 0 && (
        <Section eyebrow="Research" title="Country-specific signal">
          <ul className="space-y-px bg-bone-0/10">
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
        <Section eyebrow={microcopy.results.agents} title="Seven on the record">
          <ul className="grid grid-cols-1 gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-2">
            {free.agentInsights.map((a: any, i: number) => (
              <AgentPanel key={i} agent={a} index={i} />
            ))}
          </ul>
        </Section>
      )}

      {/* Risks */}
      <Section eyebrow={microcopy.results.risks} title="If still true in 90 days, this is dead.">
        <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
          {(free.whyThisIdeaWillLikelyFail ?? free.topRisks ?? [])
            .slice(0, 5)
            .map((r: string, i: number) => (
              <li key={i} className="grid grid-cols-[60px_1fr] items-baseline gap-6 py-5">
                <span className="mono-caption tabular text-verdict-kill">{`F${String(i + 1).padStart(2, "0")}`}</span>
                <span className="text-[16px] leading-snug text-bone-0">{r}</span>
              </li>
            ))}
        </ul>
      </Section>

      {/* Plan */}
      <Section eyebrow={microcopy.results.plan} title="Falsify in 48 hours, or move on.">
        <PlanTable plan={free.executionPlanner48h} fallback={free.fastestWayToProveWrong48h ?? free.executionPlan} />
      </Section>

      {/* Founder Decision Panel — keeps existing FDS workflow */}
      <Section eyebrow="Decision system" title="What you do next is on the record.">
        <FounderDecisionPanel validation={free} />
      </Section>

      <div className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-bone-0/10 pt-8">
        <div className="mono-caption text-bone-2">
          Memo {memoId} · Filed {date} · Advisory only.
        </div>
        <Link href="/dashboard/validate" className="tab-cta">
          <span>{microcopy.results.submitNew}</span>
          <span className="tab-cta-arrow">→</span>
        </Link>
      </div>
    </article>
  )
}

function verdictFallback(c: string) {
  if (c === "high") return "Stop polishing copy. Run the falsification plan this week."
  if (c === "low") return "Not a serious company in this shape. Different customer, problem, or model."
  return "Sharpen the wedge inside two weeks or the window closes."
}

function DiptychPanel({ label, body, dim }: { label: string; body: string; dim?: boolean }) {
  return (
    <div className="bg-ink-0 p-8 md:p-10">
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
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, ease: ease.editorial }}
      className="mt-24"
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
    <div className="bg-ink-0 p-6">
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
  return (
    <span className="inline-flex">
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.07 * i, ease: ease.editorial }}
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
