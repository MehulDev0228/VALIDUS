"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { EditorialFooter } from "@/components/marketing/editorial-footer"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

export default function AlphaPage() {
  const a = microcopy.alpha
  const [email, setEmail] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          inviteCode: inviteCode.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : a.errorGeneric)
        setBusy(false)
        return
      }
      setOk(true)
    } catch {
      setErr(a.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <MarketingNav />
      <main className="mx-auto max-w-[720px] px-6 pb-32 pt-28 md:px-10 md:pt-36">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: ease.editorial }}
          className="mono-caption text-bone-2"
        >
          {a.eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: ease.editorial }}
          className="mt-4 font-serif text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-0.025em]"
        >
          {a.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: ease.editorial }}
          className="mt-6 text-[17px] leading-[1.65] text-bone-1"
        >
          {a.body}
        </motion.p>

        {ok ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 border border-bone-0/12 bg-ink-1/30 p-8 md:p-10"
          >
            <div className="mono-caption text-verdict-build">{a.successTitle}</div>
            <p className="mt-4 text-[15px] leading-relaxed text-bone-0">{a.successBody}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth?next=/dashboard" className="tab-cta">
                <span>{a.signInCta}</span>
                <span className="tab-cta-arrow">→</span>
              </Link>
              <Link href="/" className="mono-caption self-center text-bone-2 underline-offset-4 hover:text-bone-0">
                ← Back home
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: ease.editorial }}
            onSubmit={submit}
            className="mt-12 space-y-8 border-t border-bone-0/10 pt-10"
          >
            <div>
              <label htmlFor="wait-email" className="mono-caption mb-3 block text-bone-2">
                {a.emailLabel}
              </label>
              <input
                id="wait-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-bone-0/15 bg-transparent py-3 text-[16px] text-bone-0 outline-none focus:border-bone-0/40"
              />
            </div>
            <div>
              <label htmlFor="wait-invite" className="mono-caption mb-3 block text-bone-2">
                {a.inviteLabel}
              </label>
              <input
                id="wait-invite"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full border-b border-bone-0/15 bg-transparent py-3 font-mono text-[14px] text-bone-0 outline-none focus:border-bone-0/40"
              />
              <p className="mono-caption mt-2 text-bone-2">{a.inviteHelp}</p>
            </div>
            <div>
              <label htmlFor="wait-note" className="mono-caption mb-3 block text-bone-2">
                {a.noteLabel}
              </label>
              <textarea
                id="wait-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-y border border-bone-0/10 bg-transparent px-3 py-3 text-[15px] leading-relaxed text-bone-0 outline-none focus:border-bone-0/25"
              />
            </div>

            {err ? (
              <div className="border-l-2 border-verdict-kill/50 bg-verdict-kill/[0.04] px-4 py-3" role="alert">
                <p className="mono-caption mb-1 text-bone-2">Could not submit</p>
                <p className="text-[14px] text-bone-0">{err}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className={`tab-cta ${busy ? "pointer-events-none opacity-50" : ""}`}
            >
              <span>{busy ? a.submitting : a.submit}</span>
              <span className="tab-cta-arrow">→</span>
            </button>
          </motion.form>
        )}
      </main>
      <EditorialFooter />
    </div>
  )
}
