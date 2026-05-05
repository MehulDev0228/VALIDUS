"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { LoadingTheatre } from "@/components/loading-theatre"

const MAX_PER_DAY = 2

type Field = "title" | "problem" | "idea" | "market"

const fields: Array<{ key: Field; label: string; gutter: string; placeholder: string }> = [
  { key: "title", label: "01 — Title", gutter: "T", placeholder: microcopy.validate.placeholder.title },
  { key: "problem", label: "02 — The problem on file", gutter: "P", placeholder: microcopy.validate.placeholder.problem },
  { key: "idea", label: "03 — The proposed wedge", gutter: "I", placeholder: microcopy.validate.placeholder.idea },
  { key: "market", label: "04 — Market & buyer", gutter: "M", placeholder: microcopy.validate.placeholder.market },
]

export default function ValidatePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [data, setData] = useState<Record<Field, string>>({
    title: "",
    problem: "",
    idea: "",
    market: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedToday, setUsedToday] = useState(0)

  // Pre-fill from iteration engine
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

    try {
      const today = new Date().toISOString().slice(0, 10)
      const raw = typeof window !== "undefined" ? localStorage.getItem(`fv_used_${today}`) : null
      setUsedToday(raw ? Number(raw) : 0)
    } catch {}
  }, [])

  const totalChars = useMemo(
    () => Object.values(data).reduce((sum, v) => sum + v.length, 0),
    [data],
  )
  const ready = data.title.trim().length >= 3 && data.idea.trim().length >= 40

  // Field auto-grow
  function autosize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  async function handleSubmit() {
    if (!ready || submitting) return
    setError(null)
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

      let fingerprint: string | null = null
      try {
        fingerprint = localStorage.getItem("fv_fingerprint")
        if (!fingerprint) {
          fingerprint = `fp_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
          localStorage.setItem("fv_fingerprint", fingerprint)
        }
      } catch {}

      try {
        void fetch("/api/metrics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "activation_submit_idea", payload: { hasUser: !!user } }),
        })
      } catch {}

      const res = await fetch("/api/validate-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_data: ideaPayload, user_id: user?.id, fingerprint }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg = err?.error || microcopy.validate.errors.generic
        if (res.status === 429) {
          setError(microcopy.validate.errors.rateLimit)
        } else {
          setError(msg)
        }
        setSubmitting(false)
        return
      }

      const json = await res.json()
      if (!json?.success) {
        setError(json?.error || microcopy.validate.errors.generic)
        setSubmitting(false)
        return
      }

      try {
        localStorage.setItem("validationResults", JSON.stringify(json.validation_results))
        localStorage.setItem("ideaId", json.idea_id)
        const today = new Date().toISOString().slice(0, 10)
        const next = usedToday + 1
        localStorage.setItem(`fv_used_${today}`, String(next))
      } catch {}

      router.push("/dashboard/validate/results")
    } catch (e) {
      setError(e instanceof Error ? e.message : microcopy.validate.errors.generic)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      {submitting && <LoadingTheatre verdictHint="BUILD" />}

      {/* Hairline header */}
      <header className="sticky top-0 z-30 border-b border-bone-0/[0.06] bg-ink-0/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-2 w-2 bg-bone-0" />
            <span className="mono-caption text-bone-0">
              Future<span className="text-bone-1">/</span>Validate
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="mono-caption tabular text-bone-1">
              {microcopy.validate.counter(usedToday, MAX_PER_DAY)}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!ready || submitting}
              className={`tab-cta ${!ready || submitting ? "pointer-events-none opacity-40" : ""}`}
            >
              <span>{submitting ? microcopy.validate.submitting : microcopy.validate.submit}</span>
              <span className="tab-cta-arrow">→</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-6 pt-20 pb-32 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.editorial }}
          className="mono-caption mb-6"
        >
          {microcopy.validate.eyebrow} · {new Date().toISOString().slice(0, 10)}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="font-serif text-[clamp(40px,5.5vw,72px)] leading-[1.05] tracking-[-0.025em]"
        >
          File a memo. The agents will argue.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: ease.editorial }}
          className="mt-6 max-w-[560px] text-[16px] leading-[1.6] text-bone-1"
        >
          Write like you'd brief a senior partner. Specifics over adjectives. The sharper the input, the sharper the verdict.
        </motion.p>

        <div className="mt-16 space-y-12">
          {fields.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 * i + 0.2, ease: ease.editorial }}
              className="grid grid-cols-[40px_1fr] gap-6 md:grid-cols-[60px_1fr]"
            >
              <div className="pt-2">
                <span className="font-serif text-[28px] italic leading-none text-bone-2">
                  {f.gutter}
                </span>
              </div>
              <div>
                <label
                  htmlFor={f.key}
                  className="mono-caption mb-3 block tabular text-bone-2"
                >
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
                      ? "font-serif text-[clamp(32px,3.6vw,48px)] tracking-[-0.02em]"
                      : "font-sans text-[18px]"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 border-l-2 border-verdict-kill bg-verdict-kill/[0.04] px-6 py-4"
            role="alert"
          >
            <div className="mono-caption mb-1 text-verdict-kill">Refused</div>
            <p className="text-[15px] leading-snug text-bone-0">{error}</p>
          </motion.div>
        )}

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-bone-0/[0.06] pt-8 md:flex-row md:items-center">
          <div className="mono-caption tabular text-bone-2">
            {totalChars.toLocaleString()} chars on the page · {ready ? "ready" : "needs more substance"}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!ready || submitting}
            className={`tab-cta ${!ready || submitting ? "pointer-events-none opacity-40" : ""}`}
          >
            <span>{submitting ? microcopy.validate.submitting : microcopy.validate.submit}</span>
            <span className="tab-cta-arrow">→</span>
          </button>
        </div>

        <p className="mono-caption mt-12 text-bone-2">
          Limit: {MAX_PER_DAY} memos per day. The judges sleep. You should too.
        </p>
      </main>
    </div>
  )
}
