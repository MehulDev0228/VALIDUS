"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { DecisionRecord, ValidationAttempt } from "@/lib/founder-workflow/types"
import { ideaKeyFromIdea } from "@/lib/founder-workflow/types"
import {
  appendDecisionRecord,
  appendValidationAttempt,
  readDecisionHistory,
  readValidationAttempts,
} from "@/lib/founder-workflow/storage"
import type { IdeaInput } from "@/lib/schemas/idea"

type Props = {
  validation: Record<string, unknown>
}

type PlannerStep = {
  order?: number
  day?: string
  platforms?: string[]
  expectedSignals?: string
  action: string
  successIf: string
  failIf: string
}

type RefinedDraft = {
  title: string
  description: string
  targetMarket: string
  industry: string
  revenueModel: string
  keyFeatures: string[]
  keyChanges: string[]
  whyChanged: string[]
}

/**
 * FounderDecisionPanel
 *
 * Editorial replacement for the legacy gradient cards. Three columns of
 * activity stack into a single ledger spine:
 *   ▸ 48-hour plan (read-only steps with success/fail rules)
 *   ▸ Validation tracker (log an attempt → outcome → learning)
 *   ▸ Iteration engine (refine the brief from this run + tracker)
 *
 * The decision history rendered by the dashboard ledger eclipses the old
 * inline list, so this panel intentionally does not duplicate it.
 */
export function FounderDecisionPanel({ validation }: Props) {
  const router = useRouter()
  const [ideaId, setIdeaId] = useState<string | null>(null)
  const [lastInput, setLastInput] = useState<IdeaInput | null>(null)
  const [attempts, setAttempts] = useState<ValidationAttempt[]>([])
  const [actionTaken, setActionTaken] = useState("")
  const [resultText, setResultText] = useState("")
  const [learnings, setLearnings] = useState("")
  const [iterateLoading, setIterateLoading] = useState(false)
  const [iterateError, setIterateError] = useState<string | null>(null)
  const [refined, setRefined] = useState<RefinedDraft | null>(null)
  const [logBusy, setLogBusy] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  const ideaKey = useMemo(() => {
    if (!lastInput?.title) return ""
    return ideaKeyFromIdea({ title: lastInput.title, description: lastInput.description || "" })
  }, [lastInput])

  const normalizeAttemptResult = useCallback((r: unknown): string => {
    if (typeof r === "string") return r
    if (r === "success" || r === "partial" || r === "fail") return r.toUpperCase()
    return String(r ?? "")
  }, [])

  const refreshAttempts = useCallback(async () => {
    const local = (ideaKey ? readValidationAttempts(ideaKey) : []).map((a) => ({
      ...a,
      result: normalizeAttemptResult(a.result),
    }))

    if (!ideaId) {
      setAttempts(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      return
    }

    try {
      const res = await fetch(`/api/validation-log?ideaId=${encodeURIComponent(ideaId)}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.logs)) {
        const fromServer: ValidationAttempt[] = data.logs.map(
          (log: { id: string; actionTaken: string; result: string; learnings: string; timestamp: string }) => ({
            id: log.id,
            ideaKey,
            ideaTitle: lastInput?.title ?? "—",
            actionTaken: log.actionTaken,
            result: log.result,
            learnings: log.learnings,
            createdAt: log.timestamp,
          }),
        )
        const byId = new Map<string, ValidationAttempt>()
        for (const a of fromServer) byId.set(a.id, a)
        for (const a of local) if (!byId.has(a.id)) byId.set(a.id, a)
        setAttempts(Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      } else {
        setAttempts(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      }
    } catch {
      setAttempts(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }
  }, [ideaId, ideaKey, lastInput?.title, normalizeAttemptResult])

  // Hydrate identity from localStorage written by the validate flow.
  useEffect(() => {
    if (typeof window === "undefined") return
    setIdeaId(localStorage.getItem("ideaId"))
    try {
      const raw = localStorage.getItem("lastIdeaInput")
      if (raw) setLastInput(JSON.parse(raw) as IdeaInput)
    } catch {
      setLastInput(null)
    }
  }, [])

  // First-paint side effects: ensure this run is on the ledger, fetch attempts.
  useEffect(() => {
    if (!validation || !ideaId || !lastInput?.title) return
    const key = ideaKeyFromIdea({ title: lastInput.title, description: lastInput.description || "" })
    const hist = readDecisionHistory()
    if (!hist.some((h) => h.ideaId === ideaId)) {
      const verdict = (validation as any).finalVerdict?.decision as DecisionRecord["verdict"] | undefined
      const createdAt = new Date().toISOString()
      appendDecisionRecord({
        id: ideaId,
        ideaId,
        ideaKey: key,
        title: lastInput.title,
        verdict: verdict ?? "PIVOT",
        opportunityScore: (validation as any).opportunityScore,
        summary: (validation as any).finalVerdict?.brutalSummary ?? (validation as any).summary,
        createdAt,
      })
      void fetch("/api/decision-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          ideaTitle: lastInput.title,
          verdict: verdict ?? "PIVOT",
          opportunityScore: (validation as any).opportunityScore,
          summary: (validation as any).finalVerdict?.brutalSummary ?? (validation as any).summary,
          timestamp: createdAt,
        }),
      }).catch(() => {})
    }
    void refreshAttempts()
  }, [validation, ideaId, lastInput, refreshAttempts])

  const planner = (validation as any).executionPlanner48h as PlannerStep[] | undefined

  async function handleLogAttempt() {
    setLogError(null)
    if (!lastInput?.title || !ideaKey) {
      setLogError("Missing brief context. Re-file a memo to seed the tracker.")
      return
    }
    if (!ideaId) {
      setLogError("Run id missing — re-file the memo from the validate form.")
      return
    }
    if (!actionTaken.trim() || !resultText.trim() || !learnings.trim()) {
      setLogError("All three fields. Action, outcome, learning. No vague entries.")
      return
    }
    setLogBusy(true)
    const ts = new Date().toISOString()
    try {
      await fetch("/api/validation-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          actionTaken: actionTaken.trim(),
          result: resultText.trim(),
          learnings: learnings.trim(),
          timestamp: ts,
        }),
      })
    } catch {
      // server may be unavailable; local mirror keeps the entry safe
    }
    appendValidationAttempt({
      ideaKey,
      ideaTitle: lastInput.title,
      actionTaken: actionTaken.trim(),
      result: resultText.trim(),
      learnings: learnings.trim(),
    })
    setActionTaken("")
    setResultText("")
    setLearnings("")
    setLogBusy(false)
    void refreshAttempts()
  }

  async function handleIterate() {
    if (!lastInput) return
    setIterateError(null)
    setRefined(null)
    setIterateLoading(true)
    try {
      const attemptPayload = attempts.slice(0, 12).map((a) => ({
        actionTaken: a.actionTaken,
        result: a.result,
        learnings: a.learnings,
      }))
      const res = await fetch("/api/founder/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: lastInput,
          lastValidation: validation,
          attempts: attemptPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Iteration refused")
      setRefined({
        ...data.refined,
        whyChanged: Array.isArray(data.refined?.whyChanged) ? data.refined.whyChanged : [],
      })
    } catch (e) {
      setIterateError(e instanceof Error ? e.message : "Iteration refused")
    } finally {
      setIterateLoading(false)
    }
  }

  function applyRefinedToValidate() {
    if (!refined) return
    const next: IdeaInput = {
      title: refined.title,
      description: refined.description,
      industry: refined.industry,
      targetMarket: refined.targetMarket,
      revenueModel: refined.revenueModel,
      keyFeatures: refined.keyFeatures,
      useMode: "free",
    }
    localStorage.setItem("lastIdeaInput", JSON.stringify(next))
    localStorage.setItem(
      "fv_prefill_validate",
      JSON.stringify({
        title: refined.title,
        description: refined.description,
        industry: refined.industry,
        target_market: refined.targetMarket,
        revenue_model: refined.revenueModel,
        key_features: refined.keyFeatures.join(", "),
      }),
    )
    router.push("/dashboard/validate")
  }

  return (
    <div className="space-y-16">
      {/* 48-hour plan */}
      <Block label="48-hour plan" title="Falsify or fold." caption="every step has a stop condition">
        {planner && planner.length > 0 ? (
          <ol className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
            {planner.map((step, i) => (
              <li
                key={i}
                className="grid grid-cols-1 gap-3 py-6 md:grid-cols-[80px_1fr_1fr_1fr] md:gap-6"
                data-cursor="read"
              >
                <span className="mono-caption tabular text-bone-2">
                  {step.day ? step.day : `Day ${step.order ?? i + 1}`}
                </span>
                <div>
                  <div className="text-[15px] leading-snug text-bone-0">{step.action}</div>
                  {step.platforms && step.platforms.length > 0 && (
                    <div className="mono-caption mt-2 text-bone-2">
                      platforms — {step.platforms.join(", ")}
                    </div>
                  )}
                  {step.expectedSignals && (
                    <div className="mono-caption mt-1 text-bone-2">
                      signal — {step.expectedSignals}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mono-caption text-verdict-build">continue if</div>
                  <p className="mt-1 text-[14px] leading-snug text-bone-0">{step.successIf}</p>
                </div>
                <div>
                  <div className="mono-caption text-verdict-kill">kill or pivot if</div>
                  <p className="mt-1 text-[14px] leading-snug text-bone-0">{step.failIf}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mono-caption text-bone-2">
            No structured planner in this run. Use the prove-wrong list above as the brief.
          </p>
        )}
      </Block>

      {/* Validation tracker */}
      <Block label="Validation tracker" title="Log what actually happened." caption="this feeds the iteration engine">
        <div className="grid gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-3">
          <Field
            label="Action taken"
            value={actionTaken}
            onChange={setActionTaken}
            placeholder="12 cold DMs to ops managers, 1 landing page A/B"
          />
          <Field
            label="Outcome"
            value={resultText}
            onChange={setResultText}
            placeholder="counts, verbatim replies, objections, conversion, silence…"
            multiline
          />
          <Field
            label="Learning"
            value={learnings}
            onChange={setLearnings}
            placeholder="what would you do differently tomorrow?"
            multiline
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="mono-caption text-bone-2">
            {attempts.length === 0 ? "no attempts on file" : `${attempts.length} attempt${attempts.length === 1 ? "" : "s"} on file`}
          </div>
          <button
            type="button"
            onClick={handleLogAttempt}
            disabled={!ideaKey || !ideaId || logBusy}
            className={`tab-cta ${(!ideaKey || !ideaId || logBusy) ? "pointer-events-none opacity-40" : ""}`}
            data-cursor="file"
          >
            <span>{logBusy ? "Logging…" : "Log attempt"}</span>
            <span className="tab-cta-arrow">→</span>
          </button>
        </div>
        {logError && (
          <div className="mt-4 border-l-2 border-verdict-kill bg-verdict-kill/[0.04] px-4 py-3">
            <span className="mono-caption text-verdict-kill">REFUSED</span>
            <p className="mt-1 text-[14px] text-bone-0">{logError}</p>
          </div>
        )}

        {attempts.length > 0 && (
          <ul className="mt-10 divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
            {attempts.map((a, i) => (
              <li
                key={a.id}
                className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[120px_1fr_1fr_1fr] md:gap-6"
              >
                <span className="mono-caption tabular text-bone-2">
                  {new Date(a.createdAt).toISOString().slice(0, 10)} · #{i + 1}
                </span>
                <span className="text-[14px] text-bone-0">{a.actionTaken}</span>
                <span className="text-[14px] text-bone-1">{a.result}</span>
                <span className="text-[14px] text-bone-1">{a.learnings}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* Iteration engine */}
      <Block label="Iteration engine" title="Rewrite the brief, sharper." caption="uses this run + your tracker entries">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleIterate}
            disabled={!lastInput || iterateLoading}
            className={`tab-cta ${!lastInput || iterateLoading ? "pointer-events-none opacity-40" : ""}`}
            data-cursor="file"
          >
            <span>{iterateLoading ? "Rewriting…" : "Generate sharper draft"}</span>
            <span className="tab-cta-arrow">→</span>
          </button>
          {!lastInput && (
            <span className="mono-caption text-bone-2">no brief on file — re-file from the validate form</span>
          )}
        </div>
        {iterateError && (
          <div className="mt-4 border-l-2 border-verdict-kill bg-verdict-kill/[0.04] px-4 py-3">
            <span className="mono-caption text-verdict-kill">REFUSED</span>
            <p className="mt-1 text-[14px] text-bone-0">{iterateError}</p>
          </div>
        )}
        {refined && (
          <article className="mt-8 border border-bone-0/10 bg-ink-1 p-8 md:p-10">
            <div className="mono-caption mb-4">refined draft</div>
            <h4 className="font-serif text-[28px] leading-snug tracking-[-0.02em] text-bone-0">
              {refined.title}
            </h4>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.55] text-bone-1">
              {refined.description}
            </p>
            {refined.whyChanged?.length > 0 && (
              <div className="mt-8">
                <div className="mono-caption mb-2">why this version changed</div>
                <ul className="space-y-2">
                  {refined.whyChanged.map((c, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-snug text-bone-0">
                      <span className="select-none text-bone-2">—</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {refined.keyChanges?.length > 0 && (
              <div className="mt-6">
                <div className="mono-caption mb-2">what moved in the pitch</div>
                <ul className="space-y-2">
                  {refined.keyChanges.map((c, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-snug text-bone-1">
                      <span className="select-none text-bone-2">—</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={applyRefinedToValidate} className="tab-cta" data-cursor="file">
                <span>Re-file with this draft</span>
                <span className="tab-cta-arrow">→</span>
              </button>
            </div>
          </article>
        )}
      </Block>
    </div>
  )
}

function Block({
  label,
  title,
  caption,
  children,
}: {
  label: string
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="mb-6 flex items-end justify-between border-b border-bone-0/10 pb-4">
        <div>
          <div className="mono-caption">{label}</div>
          <h3 className="mt-2 font-serif text-[24px] leading-tight tracking-[-0.02em] text-bone-0">{title}</h3>
        </div>
        {caption && <div className="mono-caption text-bone-2">{caption}</div>}
      </header>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div className="bg-ink-0 p-5">
      <label className="mono-caption mb-3 block text-bone-2">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none border-0 bg-transparent text-[14px] leading-snug text-bone-0 placeholder:text-bone-2/70 focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent text-[14px] text-bone-0 placeholder:text-bone-2/70 focus:outline-none"
        />
      )}
    </div>
  )
}
