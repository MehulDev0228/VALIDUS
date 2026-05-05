"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export function FounderDecisionPanel({ validation }: Props) {
  const router = useRouter()
  const [ideaId, setIdeaId] = useState<string | null>(null)
  const [lastInput, setLastInput] = useState<IdeaInput | null>(null)
  const [history, setHistory] = useState<DecisionRecord[]>([])
  const [attempts, setAttempts] = useState<ReturnType<typeof readValidationAttempts>>([])
  const [actionTaken, setActionTaken] = useState("")
  const [resultText, setResultText] = useState("")
  const [learnings, setLearnings] = useState("")
  const [iterateLoading, setIterateLoading] = useState(false)
  const [iterateError, setIterateError] = useState<string | null>(null)
  const [refined, setRefined] = useState<{
    title: string
    description: string
    targetMarket: string
    industry: string
    revenueModel: string
    keyFeatures: string[]
    keyChanges: string[]
    whyChanged: string[]
  } | null>(null)

  const ideaKey = useMemo(() => {
    if (!lastInput?.title) return ""
    return ideaKeyFromIdea({ title: lastInput.title, description: lastInput.description || "" })
  }, [lastInput])

  const normalizeAttemptResult = useCallback((r: unknown): string => {
    if (typeof r === "string") return r
    if (r === "success" || r === "partial" || r === "fail") return r.toUpperCase()
    return String(r ?? "")
  }, [])

  const refreshMerged = useCallback(async () => {
    let localAttempts = ideaKey ? readValidationAttempts(ideaKey) : []
    localAttempts = localAttempts.map((a) => ({
      ...a,
      result: normalizeAttemptResult(a.result),
    }))

    if (ideaId) {
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
          const byId = new Map<string, (typeof localAttempts)[0]>()
          for (const a of fromServer) byId.set(a.id, a)
          for (const a of localAttempts) if (!byId.has(a.id)) byId.set(a.id, a)
          setAttempts(Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        } else {
          setAttempts(localAttempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        }
      } catch {
        setAttempts(localAttempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      }
    } else {
      setAttempts(localAttempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }

    try {
      const res = await fetch("/api/decision-history")
      const data = await res.json()
      if (data.success && Array.isArray(data.decisions)) {
        const merged = mergeDecisionRecords(
          data.decisions as {
            id: string
            ideaId: string
            ideaTitle: string
            verdict: DecisionRecord["verdict"]
            opportunityScore?: number
            summary?: string
            timestamp: string
          }[],
          readDecisionHistory(),
        )
        setHistory(merged)
      } else {
        setHistory(readDecisionHistory())
      }
    } catch {
      setHistory(readDecisionHistory())
    }
  }, [ideaId, ideaKey, lastInput?.title, normalizeAttemptResult])

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
    void refreshMerged()
  }, [validation, ideaId, lastInput, refreshMerged])

  const planner = (validation as any).executionPlanner48h as
    | {
        order?: number
        day?: string
        platforms?: string[]
        expectedSignals?: string
        action: string
        successIf: string
        failIf: string
      }[]
    | undefined

  const handleLogAttempt = async () => {
    if (!lastInput?.title || !ideaKey) return
    if (!ideaId) {
      alert("Missing run id — run a validation again from the wizard.")
      return
    }
    if (!actionTaken.trim() || !resultText.trim() || !learnings.trim()) {
      alert("Add action, result, and learnings.")
      return
    }
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
      // still mirror locally when server / disk persistence is unavailable
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
    void refreshMerged()
  }

  const handleIterate = async () => {
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
      if (!res.ok) throw new Error(data.error || "Iteration failed")
      setRefined({
        ...data.refined,
        whyChanged: Array.isArray(data.refined?.whyChanged) ? data.refined.whyChanged : [],
      })
    } catch (e) {
      setIterateError(e instanceof Error ? e.message : "Iteration failed")
    } finally {
      setIterateLoading(false)
    }
  }

  const applyRefinedToValidate = () => {
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
    <div className="space-y-6 mb-10">
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-cyan-200">Founder Decision System</h2>
        <p className="text-[11px] text-gray-400 mt-1">
          Decide, run a test, log reality, iterate. Logs sync to lightweight file storage via API when the host disk is
          available; this browser keeps a fallback copy locally.
        </p>
      </div>

      {/* Execution Planner */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">48-hour execution plan</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Each step has pass/fail rules so you know when to pivot or stop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(planner && planner.length > 0 ? planner : []).map((step, i) => (
            <div key={i} className="rounded-md border border-white/10 bg-black/30 p-3 text-xs text-gray-200">
              <p className="font-semibold text-cyan-300 mb-1">
                {step.day ? `${step.day} · ` : ""}
                Step {step.order ?? i + 1}: {step.action}
              </p>
              {step.platforms && step.platforms.length > 0 && (
                <p className="text-[11px] text-gray-400 mb-1">
                  <span className="text-orange-300/90">Platforms:</span> {step.platforms.join(", ")}
                </p>
              )}
              {step.expectedSignals && (
                <p className="text-[11px] text-gray-300 mb-1">
                  <span className="text-amber-200/90">Expected signals:</span> {step.expectedSignals}
                </p>
              )}
              <p>
                <span className="text-emerald-400/90">Continue if:</span> {step.successIf}
              </p>
              <p className="mt-1">
                <span className="text-rose-400/90">Pivot or kill if:</span> {step.failIf}
              </p>
            </div>
          ))}
          {(!planner || planner.length === 0) && (
            <p className="text-xs text-gray-500">No structured planner in this run; use the prove-wrong list above.</p>
          )}
        </CardContent>
      </Card>

      {/* Validation Tracker */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">Validation tracker</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Action you took, what happened, what you learned. Feeds the iteration engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Action taken</Label>
              <Input
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g. 12 cold DMs to ops managers, 1 landing page A/B"
                className="bg-black/40 border-white/15 text-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Result (what actually happened)</Label>
              <Textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                className="bg-black/40 border-white/15 text-white text-xs min-h-[56px]"
                placeholder="Counts, verbatim replies, objections, conversion, silence…"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Learnings (be specific)</Label>
              <Textarea
                value={learnings}
                onChange={(e) => setLearnings(e.target.value)}
                className="bg-black/40 border-white/15 text-white text-xs min-h-[72px]"
                placeholder="What would you do differently tomorrow?"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="w-fit bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={handleLogAttempt}
              disabled={!ideaKey || !ideaId}
            >
              Save attempt
            </Button>
          </div>
          {attempts.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2 max-h-48 overflow-y-auto">
              {attempts.map((a) => (
                <div key={a.id} className="text-[11px] text-gray-400 border border-white/5 rounded p-2">
                  <span className="text-gray-200 font-medium">{a.actionTaken}</span>
                  <p className="text-gray-300 mt-1">
                    <span className="text-cyan-500/90">Outcome:</span> {a.result}
                  </p>
                  <p className="text-gray-500 mt-1">{a.learnings}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Iteration Engine */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">Iteration engine</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Rewrite your pitch using last report + tracker entries, then validate again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-violet-500/50 text-violet-200 hover:bg-violet-500/10"
            disabled={!lastInput || iterateLoading}
            onClick={handleIterate}
          >
            {iterateLoading ? "Rewriting..." : "Generate improved idea draft"}
          </Button>
          {iterateError && <p className="text-xs text-red-400">{iterateError}</p>}
          {refined && (
            <div className="rounded-md border border-violet-500/25 bg-violet-500/5 p-3 text-xs text-gray-200 space-y-2">
              <p className="font-semibold text-violet-200">{refined.title}</p>
              <p className="whitespace-pre-wrap">{refined.description}</p>
              {refined.whyChanged?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-violet-300 mb-1">Why this version changed</p>
                  <ul className="list-disc list-inside text-gray-400">
                    {refined.whyChanged.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {refined.keyChanges?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 mb-1">What moved in the pitch</p>
                  <ul className="list-disc list-inside text-gray-400">
                    {refined.keyChanges.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={applyRefinedToValidate}>
                Open validate form with this draft
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision History */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">Decision history</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Newest first — merged from browser + optional server store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-56 overflow-y-auto text-[11px]">
          {history.length === 0 && <p className="text-gray-500">No history yet.</p>}
          {history.map((h) => (
            <div key={h.id} className="flex justify-between gap-2 border border-white/5 rounded px-2 py-1.5">
              <div className="min-w-0">
                <span className="text-gray-200 truncate block">{h.title}</span>
                {typeof h.opportunityScore === "number" && (
                  <span className="text-gray-500">{h.opportunityScore}/100 · </span>
                )}
                <span className="text-gray-500">{new Date(h.createdAt).toLocaleString()}</span>
              </div>
              <span className="shrink-0 text-cyan-300">{h.verdict}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

type ServerDecisionRow = {
  id: string
  ideaId: string
  ideaTitle: string
  verdict: DecisionRecord["verdict"]
  opportunityScore?: number
  summary?: string
  timestamp: string
}

function mergeDecisionRecords(server: ServerDecisionRow[], local: DecisionRecord[]): DecisionRecord[] {
  const map = new Map<string, DecisionRecord>()
  for (const l of local) map.set(l.id, l)
  for (const s of server) {
    const row: DecisionRecord = {
      id: s.id,
      ideaId: s.ideaId,
      ideaKey: "",
      title: s.ideaTitle,
      verdict: s.verdict,
      opportunityScore: s.opportunityScore,
      summary: s.summary,
      createdAt: s.timestamp,
    }
    map.set(row.id, row)
  }
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
