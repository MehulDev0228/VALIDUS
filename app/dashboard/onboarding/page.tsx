"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/dashboard-nav"
import { ease } from "@/lib/motion"
import { microcopy } from "@/lib/microcopy"

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink-0 text-bone-0">
        <DashboardNav />
        <main className="grid h-[50vh] place-items-center">
          <span className="mono-caption text-bone-2">{microcopy.dashboard.loading}</span>
        </main>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get("next") || "/dashboard"
  const { user, loading } = useAuth()

  const [statement, setStatement] = useState("")
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

  if (loading || !user) {
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
      // Send the single statement, the backend can infer the rest later
      const res = await fetch("/api/founder-memory/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statement: statement.trim() || undefined,
          founderStage: "idea", // defaults to prevent schema errors
          technical: "hybrid",
          market: "unsure",
          team: "solo",
          traction: "none",
          experience: "first_time",
        }),
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

  function autosize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />

      {/* Progress bar — warm ember accent */}
      <div className="h-px w-full bg-bone-0/[0.04]">
        <motion.div
          className="h-px bg-ember/40"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: ease.editorial }}
        />
      </div>

      <main className="mx-auto max-w-[640px] px-6 pb-32 pt-16 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ease.editorial }}
        >
          <div className="flex items-center gap-3">
            <span className="mono-caption text-ember/60">{microcopy.onboarding.eyebrow}</span>
          </div>
          <h1 className="mt-4 font-serif text-[clamp(32px,4vw,44px)] leading-tight tracking-[-0.02em]">
            What are you working on right now?
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-bone-1">
            One honest paragraph. Everything else can be inferred.
          </p>
        </motion.header>

        {/* One question at a time — full focus */}
        <div className="mt-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: ease.editorial }}
          >
            <textarea
              rows={3}
              value={statement}
              onChange={(e) => {
                setStatement(e.target.value)
                autosize(e.currentTarget)
              }}
              ref={(el) => autosize(el)}
              placeholder="I'm trying to figure out if..."
              className="w-full resize-none border-0 border-b border-bone-0/10 bg-transparent py-4 text-[clamp(20px,2.5vw,28px)] leading-[1.4] text-bone-0 placeholder:text-bone-2/40 focus:border-bone-0 focus:outline-none"
              autoFocus
            />
          </motion.div>
        </div>

        {err ? <p className="mono-caption mt-8 text-ash">{err}</p> : null}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={busy || statement.trim().length < 10}
            onClick={() => void submit()}
            className={`tab-cta ${busy || statement.trim().length < 10 ? "pointer-events-none opacity-50" : ""}`}
          >
            <span>{busy ? microcopy.onboarding.saving : "Continue to workspace"}</span>
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
            className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0"
          >
            {microcopy.onboarding.skip}
          </button>
        </div>
      </main>
    </div>
  )
}
