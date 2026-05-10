"use client"

import type React from "react"
import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Balancer from "react-wrap-balancer"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ease } from "@/lib/motion"
import { microcopy } from "@/lib/microcopy"

type Tab = "in" | "up"

const VERDICTS = [
  { tag: "BUILD" as const, sub: "Looks worth testing next." },
  { tag: "PIVOT" as const, sub: "Right problem — reshape the wedge." },
  { tag: "KILL" as const, sub: "Pause or drop as stated." },
]

/**
 * AuthPage — split-panel sign-in: brand left, controls right.
 */
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-0 text-bone-0" />}>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageContent() {
  const { signIn, signUp, signInWithGoogle, user, loading, authConfigured } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const next = useMemo(() => {
    const raw = search?.get("next") || "/dashboard"
    return raw.startsWith("/") ? raw : "/dashboard"
  }, [search])

  const [tab, setTab] = useState<Tab>("up")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verdictIdx, setVerdictIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setVerdictIdx((i) => (i + 1) % VERDICTS.length), 4800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const err = search?.get("error")
    if (err === "auth") {
      setError(microcopy.auth.oauthError)
    }
  }, [search])

  useEffect(() => {
    if (user && !loading) {
      router.push(next)
    }
  }, [user, loading, router, next])

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    if (!email || !password) {
      setError("Email and password to continue.")
      setSubmitting(false)
      return
    }
    const result = await signIn(email, password)
    if (result.error) setError(result.error)
    else {
      setSuccess("Opening your workspace.")
      setTimeout(() => router.push(next), 600)
    }
    setSubmitting(false)
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email") || "")
    const password = String(data.get("password") || "")
    const fullName = String(data.get("fullName") || "")
    if (!email || !password || !fullName) {
      setError("Name, email, and password to continue.")
      setSubmitting(false)
      return
    }
    if (password.length < 6) {
      setError("Password too short. Six characters minimum.")
      setSubmitting(false)
      return
    }
    const result = await signUp(email, password, fullName)
    if (result.error) setError(result.error)
    else {
      setSuccess("Account ready — opening workspace.")
      setTimeout(() => router.push(next), 600)
    }
    setSubmitting(false)
  }

  async function handleGoogle() {
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await signInWithGoogle(next)
    } catch {
      setError("Google sign-in refused.")
    }
    setSubmitting(false)
  }

  const vtone =
    VERDICTS[verdictIdx].tag === "BUILD"
      ? "text-verdict-build"
      : VERDICTS[verdictIdx].tag === "KILL"
      ? "text-verdict-kill"
      : "text-verdict-pivot"

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <header className="border-b border-bone-0/[0.04]">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-ember/90" />
            <span className="mono-caption text-bone-0">{microcopy.brand.name}</span>
          </Link>
          <Link href="/" className="mono-caption text-bone-2 hover:text-bone-0">
            ← home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1320px] grid-cols-1 md:grid-cols-2 md:gap-px md:bg-bone-0/[0.08] lg:min-h-[calc(100vh-64px)]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: ease.editorial }}
          className="relative flex flex-col justify-between bg-ink-0 px-6 py-14 md:border-b-0 md:px-10 md:py-24"
        >
          <div className="max-w-[480px]">
            <p className="marketing-label">{microcopy.brand.name}</p>
            <h1 className="marketing-display mt-6">
              <Balancer>{microcopy.brand.tagline}</Balancer>
            </h1>
            <p className="marketing-body mt-8 text-bone-1">{microcopy.brand.promise}</p>

            <div className="relative mt-20 min-h-[200px]">
              <div className="absolute inset-x-0 top-0 h-px bg-bone-0/[0.08]" aria-hidden />
              <AnimatePresence mode="wait">
                <motion.div
                  key={VERDICTS[verdictIdx].tag}
                  initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                  transition={{ duration: 0.42, ease: ease.editorial }}
                  className="pt-14"
                  aria-live="polite"
                >
                  <p className="mono-caption text-bone-2">Sample verdict band</p>
                  <div className={`mt-4 font-sans text-[clamp(48px,11vw,120px)] font-semibold leading-none tracking-[-0.04em] ${vtone}`}>
                    {VERDICTS[verdictIdx].tag}
                  </div>
                  <p className="mt-6 font-serif text-[17px] leading-relaxed italic text-bone-1">
                    {VERDICTS[verdictIdx].sub}
                  </p>
                </motion.div>
              </AnimatePresence>

              <p className="mono-caption mt-12 text-bone-2">{microcopy.auth.socialProof}</p>
            </div>
          </div>

          <p className="mono-caption mt-16 max-w-[400px] text-bone-2 md:mt-0">
            Structured memos · seven fixed angles · no chat thread theatrics.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.08, ease: ease.editorial }}
          className="flex flex-col justify-center bg-ink-0 px-6 py-14 md:border-b-0 md:px-10 md:py-24 lg:py-28"
        >
          <div className="warm-surface rounded-sm border border-bone-0/[0.06] p-8 md:p-10">
            <h2 className="font-serif text-[clamp(26px,3vw,40px)] font-light tracking-[-0.02em] text-bone-0">
              {tab === "in" ? "Sign in" : "Open an account"}
            </h2>
            <p className="marketing-body mt-4 max-w-[420px] text-bone-1">
              {tab === "in"
                ? "Continue where your memos stopped — same template every rerun."
                : "No card on signup. First memo opens when you're ready."}
            </p>

            <div className="mt-8 inline-flex rounded-sm border border-bone-0/[0.06] overflow-hidden">
              <TabButton active={tab === "in"} onClick={() => setTab("in")}>
                Sign in
              </TabButton>
              <TabButton active={tab === "up"} onClick={() => setTab("up")}>
                Open account
              </TabButton>
            </div>
            {!authConfigured ? (
              <div className="mt-8 rounded-sm border border-dusk/30 bg-dusk/[0.06] px-4 py-3 text-[13px] text-bone-0">
                {microcopy.auth.configBanner}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="flex w-full items-center justify-between rounded-sm border border-bone-0/[0.08] px-4 py-3 text-left transition-colors hover:border-bone-0/25 hover:bg-bone-0/[0.02]"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white shadow-sm ring-1 ring-bone-0/[0.1]">
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.21 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.21 37.01 46.98 31.28 46.98 24.55z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 46c6.48 0 11.92-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.71-13.47-8.98l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </span>
                <span className="text-[15px] text-bone-0">Continue with Google</span>
              </span>
              <span className="mono-caption text-bone-2">→</span>
            </button>

            <div className="my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-bone-0/[0.06]" />
              <span className="mono-caption text-bone-2">or use email</span>
              <span className="h-px flex-1 bg-bone-0/[0.06]" />
            </div>

            <AnimatePresence mode="wait">
              {tab === "in" ? (
                <motion.form
                  key="in"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: ease.editorial }}
                  onSubmit={handleSignIn}
                  className="space-y-6"
                >
                  <Field label="Email" name="email" type="email" autoComplete="email" />
                  <Field label="Password" name="password" type="password" autoComplete="current-password" />
                  <Submit submitting={submitting} label="Sign in" />
                </motion.form>
              ) : (
                <motion.form
                  key="up"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: ease.editorial }}
                  onSubmit={handleSignUp}
                  className="space-y-6"
                >
                  <Field label="Full name" name="fullName" type="text" autoComplete="name" />
                  <Field label="Email" name="email" type="email" autoComplete="email" />
                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    hint="six characters minimum"
                  />
                  <Submit submitting={submitting} label="Open account" />
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-sm border-l-2 border-ash/40 bg-ash/[0.06] px-4 py-3"
                role="alert"
              >
                <span className="mono-caption text-ash/80">Could not complete</span>
                <p className="mt-1 text-[14px] text-bone-0">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-sm border-l-2 border-sage/40 bg-sage/[0.06] px-4 py-3"
              >
                <span className="mono-caption text-sage/80">You're in</span>
                <p className="mt-1 text-[14px] text-bone-0">{success}</p>
              </motion.div>
            )}
          </div>

          <p className="mono-caption mt-6 text-bone-2">
            Sign-in stays private — sessions only tie you to saved memos and settings.
          </p>
        </motion.section>
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mono-caption px-4 py-2 transition-colors duration-200 ${
        active ? "bg-bone-0 text-ink-0" : "text-bone-1 hover:text-bone-0"
      }`}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
  hint,
}: {
  label: string
  name: string
  type: string
  autoComplete?: string
  hint?: string
}) {
  return (
    <label className="block">
      <div className="mono-caption mb-2 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-bone-2">{hint}</span>}
      </div>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full border-0 border-b border-bone-0/[0.08] bg-transparent py-3 text-[16px] text-bone-0 placeholder:text-bone-2 focus:border-ember/40 focus:outline-none transition-colors duration-200"
      />
    </label>
  )
}

function Submit({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className={`tab-cta ${submitting ? "pointer-events-none opacity-50" : ""}`}
    >
      <span>{submitting ? "Opening…" : label}</span>
      <span className="tab-cta-arrow">→</span>
    </button>
  )
}
