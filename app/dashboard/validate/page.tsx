"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { LoadingTheatre } from "@/components/loading-theatre"
import { useChamberSettle } from "@/components/chamber"
import { Skeleton } from "@/components/ui/skeleton"
import { toastRateLimited } from "@/lib/verdict-toast"

const MAX_PER_DAY = 2

/** SSE validation — falls back to POST /api/validate-idea if stream fails. */
async function fetchValidationViaStream(
  ideaPayload: Record<string, unknown>,
  userId: string,
  fingerprint: string | null,
  onHint: (s: string) => void,
): Promise<
  | { ok: true; idea_id: string; validation_results: unknown }
  | { ok: false; error: string; code?: string; status?: number }
> {
  const res = await fetch("/api/validate-idea/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea_data: ideaPayload, user_id: userId, fingerprint }),
  })

  const ct = res.headers.get("content-type") || ""
  if (!res.ok || !ct.includes("text/event-stream")) {
    try {
      const j = (await res.json()) as { error?: string; code?: string }
      return {
        ok: false,
        error: typeof j?.error === "string" ? j.error : `HTTP ${res.status}`,
        code: j?.code,
        status: res.status,
      }
    } catch {
      return { ok: false, error: `HTTP ${res.status}`, status: res.status }
    }
  }

  const reader = res.body?.getReader()
  if (!reader) return { ok: false, error: "No response body" }

  const decoder = new TextDecoder()
  let buffer = ""
  let final: { idea_id?: string; validation_results?: unknown } | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""
    for (const ch of chunks) {
      const trimmed = ch.trim()
      if (!trimmed.startsWith("data: ")) continue
      let json: Record<string, unknown>
      try {
        json = JSON.parse(trimmed.slice(6)) as Record<string, unknown>
      } catch {
        continue
      }
      if (json.type === "progress" && typeof json.label === "string") {
        onHint(json.label)
      }
      if (json.type === "error") {
        return {
          ok: false,
          error: typeof json.error === "string" ? json.error : "Pipeline error",
          code: typeof json.code === "string" ? json.code : undefined,
          status: json.code === "RATE_LIMIT" ? 429 : 400,
        }
      }
      if (json.type === "result" && json.success) {
        final = {
          idea_id: json.idea_id as string,
          validation_results: json.validation_results,
        }
      }
    }
  }

  if (final?.validation_results != null && final.idea_id) {
    return { ok: true, idea_id: final.idea_id, validation_results: final.validation_results }
  }
  return { ok: false, error: "Stream ended without result" }
}

type Field = "title" | "problem" | "idea" | "market"

const fields: Array<{ key: Field; label: string; gutter: string; placeholder: string }> = [
  { key: "title", label: "01 — One-liner", gutter: "T", placeholder: microcopy.validate.placeholder.title },
  { key: "problem", label: "02 — Problem", gutter: "P", placeholder: microcopy.validate.placeholder.problem },
  { key: "idea", label: "03 — Wedge / solution", gutter: "I", placeholder: microcopy.validate.placeholder.idea },
  { key: "market", label: "04 — Buyer / market", gutter: "M", placeholder: microcopy.validate.placeholder.market },
]

export default function ValidatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  useChamberSettle()

  const [data, setData] = useState<Record<Field, string>>({
    title: "",
    problem: "",
    idea: "",
    market: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryable, setRetryable] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; resetInSeconds: number } | null>(null)
  const [similarBrief, setSimilarBrief] = useState<{
    runId: string
    previewTitle: string
    createdAt: string
  } | null>(null)
  const [pipelineHint, setPipelineHint] = useState<string | null>(null)

  // Auth gate
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/dashboard/validate")
    }
  }, [user, loading, router])

  // Pre-fill when navigating from founder iteration / external prefilled brief
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("fv_prefill_validate") : null
      if (raw) {
        const p = JSON.parse(raw) as Record<string, string>
        setData((prev) => ({
          title: p.title ?? prev.title,
          problem: p.problem_solving ?? p.description ?? prev.problem,
          idea: p.description ?? prev.idea,
          market: p.target_market ?? prev.market,
        }))
        localStorage.removeItem("fv_prefill_validate")
      }
    } catch {}
  }, [])

  // Live usage state from server
  useEffect(() => {
    if (!user) return
    const fingerprint = readFingerprint()
    fetch(`/api/usage?user_id=${encodeURIComponent(user.id)}&fingerprint=${encodeURIComponent(fingerprint || "")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success) setUsage({ used: j.used, limit: j.limit, resetInSeconds: j.resetInSeconds })
      })
      .catch(() => {})
  }, [user])

  const totalChars = useMemo(
    () => Object.values(data).reduce((sum, v) => sum + v.length, 0),
    [data],
  )
  const ready = data.title.trim().length >= 3 && data.idea.trim().length >= 40
  const limitReached = usage ? usage.used >= usage.limit : false

  useEffect(() => {
    if (!user) return
    const title = data.title.trim()
    const description = [data.idea, data.problem].filter(Boolean).join("\n\n").trim()
    if (title.length < 3 || description.length < 24) {
      setSimilarBrief(null)
      return
    }
    const id = window.setTimeout(() => {
      void fetch("/api/similar-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title, description }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const m = j?.match as { runId: string; previewTitle: string; createdAt: string; score: number } | null
          if (j?.success && m && typeof m.score === "number" && m.score >= 0.55) {
            setSimilarBrief({ runId: m.runId, previewTitle: m.previewTitle, createdAt: m.createdAt })
          } else {
            setSimilarBrief(null)
          }
        })
        .catch(() => setSimilarBrief(null))
    }, 800)
    return () => clearTimeout(id)
  }, [user, data.title, data.idea, data.problem])

  function autosize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  async function handleSubmit() {
    if (!ready || submitting || !user) return
    setError(null)
    setRetryable(false)
    setPipelineHint(null)
    setSubmitting(true)

    try {
      const ideaPayload = {
        title: data.title.trim(),
        description: [data.idea.trim(), data.problem.trim()].filter(Boolean).join("\n\n"),
        industry: "",
        targetMarket: data.market.trim(),
        revenueModel: "",
        keyFeatures: [] as string[],
        useMode: "free" as const,
      }

      try {
        localStorage.setItem("lastIdeaInput", JSON.stringify(ideaPayload))
      } catch {}

      const fingerprint = readFingerprint()

      try {
        void fetch("/api/metrics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "activation_submit_idea", payload: { hasUser: true } }),
        })
      } catch {}

      let json!: {
        success: boolean
        idea_id?: string
        validation_results?: unknown
        error?: string
      }

      const streamed = await fetchValidationViaStream(ideaPayload, user.id, fingerprint, setPipelineHint)

      if (streamed.ok) {
        json = {
          success: true,
          idea_id: streamed.idea_id,
          validation_results: streamed.validation_results,
        }
      } else {
        if (streamed.status === 401) {
          router.replace("/auth?next=/dashboard/validate")
          setSubmitting(false)
          return
        }
        if (streamed.status === 429 || streamed.code === "RATE_LIMIT") {
          setError(microcopy.validate.errors.rateLimit)
          toastRateLimited(microcopy.validate.errors.rateLimit)
          setRetryable(false)
          setSubmitting(false)
          return
        }

        let res: Response
        try {
          res = await fetch("/api/validate-idea", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea_data: ideaPayload, user_id: user.id, fingerprint }),
          })
        } catch {
          setError(streamed.error || microcopy.validate.errors.network)
          setRetryable(true)
          setSubmitting(false)
          return
        }

        if (!res.ok) {
          const err = await res.json().catch(() => null)
          if (res.status === 401) {
            router.replace("/auth?next=/dashboard/validate")
            return
          }
          if (res.status === 429) {
            setError(microcopy.validate.errors.rateLimit)
            toastRateLimited(microcopy.validate.errors.rateLimit)
            setRetryable(false)
          } else if (res.status === 408 || res.status === 504) {
            setError(microcopy.validate.errors.timeout)
            setRetryable(true)
          } else if (res.status >= 500) {
            setError(microcopy.validate.errors.server)
            setRetryable(true)
          } else {
            setError(typeof err?.error === "string" ? err.error : microcopy.validate.errors.generic)
            setRetryable(false)
          }
          setSubmitting(false)
          return
        }

        json = await res.json()
        if (!json?.success) {
          const msg =
            typeof json?.error === "string" ? json.error : microcopy.validate.errors.generic
          setError(msg)
          setRetryable(/try again|timeout|unavailable|service/i.test(msg))
          setSubmitting(false)
          return
        }
      }

      let nextHref = "/dashboard/validate/results"
      try {
        const persist = await fetch("/api/validation-run", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea_id: json.idea_id,
            validation_results: json.validation_results,
          }),
        })
        if (persist.ok) {
          const p = (await persist.json().catch(() => null)) as { runId?: string } | null
          if (p?.runId) {
            nextHref = `/dashboard/validate/results?run=${encodeURIComponent(p.runId)}`
          }
        }
      } catch {}

      try {
        localStorage.setItem("validationResults", JSON.stringify(json.validation_results))
        localStorage.setItem("ideaId", json.idea_id)
      } catch {}

      router.push(nextHref)
    } catch (e) {
      setError(e instanceof Error ? e.message : microcopy.validate.errors.network)
      setRetryable(true)
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <main className="mx-auto max-w-[860px] px-6 py-28 md:px-10 md:py-36">
          <div className="space-y-6">
            <Skeleton className="h-8 w-[55%] max-w-[480px] bg-bone-0/[0.06]" />
            <Skeleton className="h-36 w-full bg-bone-0/[0.05]" />
            <Skeleton className="h-24 w-full bg-bone-0/[0.04]" />
          </div>
        </main>
      </div>
    )
  }

  const fieldFill = fields.map((f) => ({
    ...f,
    done:
      (f.key === "title" && data.title.trim().length >= 3) ||
      (f.key !== "title" && data[f.key].trim().length >= 8),
  }))

  const used = usage?.used ?? 0
  const limit = usage?.limit ?? MAX_PER_DAY

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      {submitting && <LoadingTheatre verdictHint="BUILD" pipelineHint={pipelineHint} />}

      <header className="sticky top-0 z-30 border-b border-bone-0/[0.06] bg-ink-0/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="h-2 w-2 bg-bone-0" />
            <span className="mono-caption text-bone-0">
              Future<span className="text-bone-1">/</span>Validate
            </span>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <UsageIndicator used={used} limit={limit} compact />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!ready || submitting || limitReached}
              className={`tab-cta ${(!ready || submitting || limitReached) ? "pointer-events-none opacity-40" : ""}`}
            >
              <span className="hidden sm:inline">{submitting ? microcopy.validate.submitting : microcopy.validate.submit}</span>
              <span className="sm:hidden">{submitting ? microcopy.validate.submitting : "Run"}</span>
              <span className="tab-cta-arrow">→</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-6 pt-16 pb-32 md:px-10 md:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.editorial }}
          className="mono-caption mb-6 flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          {microcopy.validate.eyebrow} · {new Date().toISOString().slice(0, 10)} · {user.email || "session"}
        </motion.p>

        <div className="mb-12 flex gap-3" aria-label="Field progress">
          {fieldFill.map((f) => (
            <span
              key={f.key}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                f.done ? "bg-ember" : "bg-bone-0/15"
              }`}
              title={f.label}
            />
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="font-serif text-[clamp(36px,5.5vw,72px)] leading-[1.05] tracking-[-0.025em]"
        >
          {microcopy.validate.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: ease.editorial }}
          className="mt-6 max-w-[560px] text-[16px] leading-[1.6] text-bone-1"
        >
          {microcopy.validate.lead}
        </motion.p>

        {limitReached && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 border-l-2 border-verdict-kill bg-verdict-kill/[0.04] px-6 py-4"
            role="alert"
          >
            <div className="mono-caption mb-1 text-bone-2">Daily limit</div>
            <p className="text-[15px] leading-snug text-bone-0">
              {microcopy.validate.errors.rateLimit}
            </p>
            <p className="mono-caption mt-2 tabular text-bone-2">
              resets in <ResetCountdown seconds={usage?.resetInSeconds ?? 0} />
            </p>
          </motion.div>
        )}

        <div className="mt-12 space-y-12 md:mt-16">
          {fields.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 * i + 0.2, ease: ease.editorial }}
              className="grid grid-cols-[32px_1fr] gap-4 md:grid-cols-[60px_1fr] md:gap-6"
            >
              <div className="pt-2">
                <span className="font-serif text-[24px] italic leading-none text-bone-2 md:text-[28px]">
                  {f.gutter}
                </span>
              </div>
              <div>
                <label htmlFor={f.key} className="mono-caption mb-3 block tabular text-bone-2">
                  {f.label}
                </label>
                <textarea
                  id={f.key}
                  rows={f.key === "title" ? 1 : 4}
                  value={data[f.key]}
                  onChange={(e) => {
                    setData((prev) => ({ ...prev, [f.key]: e.target.value }))
                    autosize(e.currentTarget)
                  }}
                  ref={(el) => autosize(el)}
                  placeholder={f.placeholder}
                  className={`w-full resize-none border-0 border-b border-bone-0/10 bg-transparent py-3 leading-[1.55] text-bone-0 placeholder:text-bone-2/70 focus:border-bone-0 focus:outline-none ${
                    f.key === "title"
                      ? "font-serif text-[clamp(28px,3.6vw,48px)] tracking-[-0.02em]"
                      : "font-sans text-[16px] md:text-[18px]"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {similarBrief ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 border-l-2 border-ember/40 bg-ember/[0.06] px-5 py-4"
            role="status"
          >
            <div className="mono-caption text-ember/80">Similar brief on your ledger</div>
            <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-bone-1">
              This run rhymes with{" "}
              <span className="text-bone-0">&ldquo;{similarBrief.previewTitle.slice(0, 120)}&rdquo;</span> from{" "}
              <span className="tabular text-bone-0">{similarBrief.createdAt.slice(0, 10)}</span> — open the prior memo
              or compare after you file again.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/validate/results?run=${encodeURIComponent(similarBrief.runId)}`}
                className="inline-flex items-center gap-2 rounded-md border border-ember/30 bg-ember/10 px-4 py-2 text-[13px] font-medium text-bone-0 transition hover:bg-ember/20"
              >
                Open prior memo
              </Link>
              <Link
                href={`/dashboard/compare?a=${encodeURIComponent(similarBrief.runId)}&b=`}
                className="inline-flex items-center gap-2 rounded-md border border-white/[0.1] px-4 py-2 text-[13px] text-bone-2 transition hover:border-white/[0.2] hover:text-bone-0"
              >
                Compare (add second run id)
              </Link>
            </div>
          </motion.div>
        ) : null}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 border-l-2 border-bone-0/25 bg-ink-1/30 px-6 py-4"
            role="alert"
          >
            <div className="mono-caption mb-1 text-bone-2">Could not file memo</div>
            <p className="text-[15px] leading-snug text-bone-0">{error}</p>
            {retryable ? (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!ready || submitting || limitReached}
                className="mono-caption mt-4 border border-bone-0/20 px-4 py-2 hover:border-bone-0/35 disabled:opacity-40"
              >
                Try again
              </button>
            ) : null}
          </motion.div>
        )}

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-bone-0/[0.06] pt-8 md:flex-row md:items-center">
          <div className="mono-caption tabular inline-flex flex-wrap gap-x-1 text-bone-2">
            <span>{totalChars.toLocaleString()} chars on the page ·</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={ready ? "ready" : "more"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: ease.editorial }}
              >
                {ready ? "ready" : "needs more substance"}
              </motion.span>
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!ready || submitting || limitReached}
            className={`tab-cta ${(!ready || submitting || limitReached) ? "pointer-events-none opacity-40" : ""}`}
          >
            <span>{submitting ? microcopy.validate.submitting : microcopy.validate.submit}</span>
            <span className="tab-cta-arrow">→</span>
          </button>
        </div>

        <p className="mono-caption mt-12 text-bone-2">
          Limit: {limit} memos per day per account. Resets at 00:00 UTC.
        </p>
      </main>
    </div>
  )
}

function readFingerprint(): string | null {
  if (typeof window === "undefined") return null
  try {
    let fp = localStorage.getItem("fv_fingerprint")
    if (!fp) {
      fp = `fp_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
      localStorage.setItem("fv_fingerprint", fp)
    }
    return fp
  } catch {
    return null
  }
}

function UsageIndicator({ used, limit, compact }: { used: number; limit: number; compact?: boolean }) {
  const segments = Array.from({ length: limit }, (_, i) => i < used)
  return (
    <div className="flex items-center gap-3">
      <span className="hidden md:inline mono-caption tabular text-bone-1">
        {used}/{limit} filed today
      </span>
      <span className={compact ? "md:hidden mono-caption tabular text-bone-1" : "mono-caption tabular text-bone-1"}>
        {used}/{limit}
      </span>
      <div className="flex gap-px">
        {segments.map((on, i) => (
          <span
            key={i}
            className={`h-2 w-5 ${on ? "bg-bone-0" : "bg-bone-0/15"}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  )
}

function ResetCountdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds)
  useEffect(() => {
    setS(seconds)
    const id = setInterval(() => setS((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds])
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return (
    <span className="tabular">
      {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(ss).padStart(2, "0")}s
    </span>
  )
}
