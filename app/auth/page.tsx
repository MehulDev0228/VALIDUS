"use client"

import type React from "react"
import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ease } from "@/lib/motion"

type Tab = "in" | "up"

/**
 * AuthPage — single-column editorial intake.
 *
 * Two modes (sign in / sign up) sit on a hairline-ruled stack. Errors are
 * Errors stay direct without dramatic chrome.
 * No card chrome, no glow, no gradients.
 */
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-0 text-bone-0" />}>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageContent() {
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const next = useMemo(() => {
    const raw = search?.get("next") || "/dashboard"
    // Allow only same-origin paths to prevent open-redirects.
    return raw.startsWith("/") ? raw : "/dashboard"
  }, [search])

  const [tab, setTab] = useState<Tab>("up") // default to sign-up — conversion bias
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      setSuccess("Routing to your workspace.")
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

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      {/* Top brand strip */}
      <header className="border-b border-bone-0/[0.06]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3" data-cursor="cite">
            <span className="h-2 w-2 bg-bone-0" />
            <span className="mono-caption text-bone-0">
              Future<span className="text-bone-1">/</span>Validate
            </span>
          </Link>
          <Link href="/" className="mono-caption text-bone-2 hover:text-bone-0">
            ← marketing
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 pt-20 pb-32 md:grid-cols-12 md:gap-16 md:px-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ease.editorial }}
          className="md:col-span-5"
        >
          <h1 className="font-serif text-[clamp(36px,4.5vw,56px)] leading-[1.05] tracking-[-0.025em]">
            {tab === "in" ? "Welcome back." : "Begin here."}
          </h1>
          <p className="mt-6 max-w-[420px] text-[16px] leading-[1.6] text-bone-1">
            {tab === "in"
              ? "Sign in to continue. Your memos and reflections are waiting."
              : "Sixty seconds. No card. Your first memo files immediately."}
          </p>
          <ul className="mt-8 space-y-3 text-[14px] leading-snug text-bone-1">
            {[
              "Two memos per day. Deliberately paced.",
              "Seven specialist reads and a single decision frame.",
              "Your private archive of decisions and learnings.",
            ].map((point) => (
              <li key={point} className="flex gap-3">
                <span className="select-none text-bone-2">—</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 inline-flex border border-bone-0/10">
            <TabButton active={tab === "in"} onClick={() => setTab("in")}>
              Sign in
            </TabButton>
            <TabButton active={tab === "up"} onClick={() => setTab("up")}>
              Open account
            </TabButton>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: ease.editorial }}
          className="md:col-span-7"
        >
          <div className="border border-bone-0/10 bg-ink-1 p-8 md:p-10">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="flex w-full items-center justify-between border border-bone-0/10 px-4 py-3 text-left transition-colors hover:border-bone-0/40"
              data-cursor="file"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center bg-bone-0">
                  <svg width="11" height="11" viewBox="0 0 24 24">
                    <path
                      fill="rgb(6,7,10)"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="rgb(6,7,10)"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="rgb(6,7,10)"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="rgb(6,7,10)"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </span>
                <span className="text-[15px] text-bone-0">Continue with Google</span>
              </span>
              <span className="mono-caption text-bone-2">→</span>
            </button>

            <div className="my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-bone-0/10" />
              <span className="mono-caption text-bone-2">or use email</span>
              <span className="h-px flex-1 bg-bone-0/10" />
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
                className="mt-6 border-l-2 border-bone-0/20 bg-ink-1/40 px-4 py-3"
                role="alert"
              >
                <span className="mono-caption text-bone-2">Could not complete</span>
                <p className="mt-1 text-[14px] text-bone-0">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border-l-2 border-bone-0/25 bg-ink-1/30 px-4 py-3"
              >
                <span className="mono-caption text-bone-0">You're in</span>
                <p className="mt-1 text-[14px] text-bone-0">{success}</p>
              </motion.div>
            )}
          </div>

          <p className="mono-caption mt-6 text-bone-2">
            Sign-in stays private — we use sessions only for your ledger and memos on file.
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
      data-cursor="read"
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
        className="w-full border-0 border-b border-bone-0/10 bg-transparent py-3 text-[16px] text-bone-0 placeholder:text-bone-2 focus:border-bone-0 focus:outline-none"
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
      data-cursor="file"
    >
      <span>{submitting ? "Filing…" : label}</span>
      <span className="tab-cta-arrow">→</span>
    </button>
  )
}
