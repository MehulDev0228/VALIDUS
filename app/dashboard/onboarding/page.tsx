"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardNav } from "@/components/dashboard-nav"
import { ease } from "@/lib/motion"
import { useAuth } from "@/contexts/auth-context"
import type { FounderOnboardingAnswers } from "@/lib/founder-memory/onboarding-schema"
import { microcopy } from "@/lib/microcopy"

const FIELDS: Array<{
  key: keyof FounderOnboardingAnswers
  label: string
  help: string
  options: Array<{ v: string; label: string }>
}> = [
  {
    key: "founderStage",
    label: "Where are you",
    help: "Rough stage — we don’t personalise models on this.",
    options: [
      { v: "idea", label: "Idea / pre-build" },
      { v: "mvp", label: "MVP in market" },
      { v: "early_revenue", label: "Early revenue" },
      { v: "scaling", label: "Scaling" },
      { v: "explorer", label: "Exploring wedges" },
    ],
  },
  {
    key: "technical",
    label: "Builder profile",
    help: "",
    options: [
      { v: "technical", label: "Technical" },
      { v: "non_technical", label: "Non-technical" },
      { v: "hybrid", label: "Hybrid" },
    ],
  },
  {
    key: "market",
    label: "Market motion",
    help: "",
    options: [
      { v: "b2b", label: "B2B" },
      { v: "b2c", label: "B2C" },
      { v: "both", label: "Both" },
      { v: "unsure", label: "Unclear yet" },
    ],
  },
  {
    key: "team",
    label: "Team",
    help: "",
    options: [
      { v: "solo", label: "Solo" },
      { v: "small_team", label: "Small team (2–8)" },
      { v: "larger", label: "Larger" },
    ],
  },
  {
    key: "traction",
    label: "Traction today",
    help: "",
    options: [
      { v: "none", label: "Pre-signal" },
      { v: "signals", label: "Qualitative signal" },
      { v: "paying", label: "Paying pilots / revenue" },
      { v: "growth", label: "Compounding usage" },
    ],
  },
  {
    key: "experience",
    label: "Founder path",
    help: "",
    options: [
      { v: "first_time", label: "First-time founder" },
      { v: "repeat", label: "Repeat founder" },
    ],
  },
]

export default function FounderOnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get("next") && search.get("next")!.startsWith("/") ? search.get("next")! : "/dashboard"

  const [form, setForm] = useState<FounderOnboardingAnswers | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace(`/auth?next=${encodeURIComponent("/dashboard/onboarding")}`)
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    fetch("/api/founder-memory")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success && j.onboarding) {
          router.replace(next)
        }
      })
      .catch(() => {})
  }, [user, router, next])

  useEffect(() => {
    setForm({
      founderStage: "idea",
      technical: "hybrid",
      market: "unsure",
      team: "solo",
      traction: "none",
      experience: "first_time",
    })
  }, [])

  if (loading || !user || !form) {
    return (
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="grid h-[50vh] place-items-center">
          <span className="mono-caption text-bone-2">{microcopy.dashboard.loading}</span>
        </main>
      </div>
    )
  }

  async function submit() {
    setErr(null)
    setBusy(true)
    try {
      const res = await fetch("/api/founder-memory/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Could not save")
      router.replace(next)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />
      <main className="mx-auto max-w-[640px] px-6 pb-32 pt-16 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.editorial }}
        >
          <p className="mono-caption text-bone-2">{microcopy.onboarding.eyebrow}</p>
          <h1 className="mt-4 font-serif text-[clamp(32px,4vw,44px)] leading-tight tracking-[-0.02em]">
            {microcopy.onboarding.title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-bone-1">{microcopy.onboarding.lead}</p>
        </motion.header>

        <div className="mt-12 space-y-12">
          {FIELDS.map((block) => (
            <fieldset key={block.key} className="space-y-4">
              <legend className="font-serif text-[20px] tracking-[-0.02em]">{block.label}</legend>
              {block.help ? <p className="text-[13px] text-bone-2">{block.help}</p> : null}
              <div className="flex flex-wrap gap-2">
                {block.options.map((o) => {
                  const active = form[block.key] === o.v
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setForm((f) => (f ? { ...f, [block.key]: o.v as never } : f))}
                      className={`border px-3 py-2 text-[13px] transition-colors ${
                        active ? "border-bone-0 text-bone-0" : "border-bone-0/15 text-bone-1 hover:border-bone-0/35"
                      }`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {err ? <p className="mono-caption mt-8 text-verdict-kill">{err}</p> : null}

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className={`tab-cta ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            <span>{busy ? microcopy.onboarding.saving : microcopy.onboarding.save}</span>
            <span className="tab-cta-arrow">→</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setErr(null)
              setBusy(true)
              try {
                const res = await fetch("/api/founder-memory/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ skip: true }),
                })
                const j = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(j.error || "Could not save")
                router.replace(next)
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Could not save")
              } finally {
                setBusy(false)
              }
            }}
            className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0 disabled:opacity-40"
          >
            {microcopy.onboarding.skip}
          </button>
        </div>
      </main>
    </div>
  )
}
