"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

/**
 * MarketingNav
 *
 * Live counter is a tabular odometer (per-digit flip). Every ~14s it briefly
 * swaps the counter caption for a forensic "+1 BUILD/PIVOT/KILL" ticker in
 * the verdict tone, then snaps back. The bottom verdict-pulse rule glides
 * across the viewport every ~6s (CSS-only) for a subtle proof-of-life.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [counter, setCounter] = useState(0)
  const [flash, setFlash] = useState<null | { v: "BUILD" | "PIVOT" | "KILL" }>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Counter — deterministic seed so it doesn't reshuffle on rerender.
  useEffect(() => {
    const seed = new Date()
    const base = (127 + seed.getUTCHours() * 11 + Math.floor(seed.getUTCMinutes() * 0.6)) | 0
    setCounter(base)
    const id = setInterval(() => {
      setCounter((c) => c + (Math.random() < 0.45 ? 1 : 0))
    }, 8500)
    return () => clearInterval(id)
  }, [])

  // Verdict ticker — fires every 14s, pauses for 1.6s, then snaps back.
  useEffect(() => {
    if (reduce) return
    const verdicts: Array<"BUILD" | "PIVOT" | "KILL"> = ["BUILD", "PIVOT", "KILL"]
    let alive = true
    const fire = () => {
      if (!alive) return
      const v = verdicts[Math.floor(Math.random() * verdicts.length)]
      setCounter((c) => c + 1)
      setFlash({ v })
      window.setTimeout(() => {
        if (alive) setFlash(null)
      }, 1600)
    }
    const id = window.setInterval(fire, 14000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [reduce])

  const counterStr = String(counter).padStart(3, "0")

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-ink-0/80 backdrop-blur-xl" : "bg-transparent"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10">
        <Link href="/" aria-label="FutureValidate — home" className="group flex items-center gap-3" data-cursor="cite">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-bone-0/40" />
            <motion.span
              className="absolute inset-0 rounded-full bg-bone-0"
              animate={reduce ? undefined : { scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone-0">
            Future<span className="text-bone-1">/</span>Validate
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex" aria-live="polite">
          <span className="mono-caption tabular flex items-center gap-2 text-bone-1">
            <span className="relative inline-flex">
              <DigitOdometer value={counterStr} />
            </span>
            <AnimatePresence mode="wait">
              {flash ? (
                <motion.span
                  key={`flash-${flash.v}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.32, ease: ease.editorial }}
                  className={
                    flash.v === "BUILD"
                      ? "text-verdict-build"
                      : flash.v === "PIVOT"
                      ? "text-verdict-pivot"
                      : "text-verdict-kill"
                  }
                >
                  +1 {flash.v}
                </motion.span>
              ) : (
                <motion.span
                  key="label"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.28, ease: ease.editorial }}
                >
                  {microcopy.nav.counter}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <SystemFlyout />
          <ValidateCta />
        </nav>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? microcopy.nav.mobileMenuClose : microcopy.nav.mobileMenuOpen}
          onClick={() => setOpen((v) => !v)}
          className="relative h-10 w-10 md:hidden"
        >
          <span
            className={`absolute left-2 right-2 top-[18px] h-px bg-bone-0 transition-transform duration-300 ${
              open ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-2 right-2 top-[24px] h-px bg-bone-0 transition-transform duration-300 ${
              open ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <div className="verdict-pulse-track h-px w-full bg-bone-0/[0.06]" />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: ease.editorial }}
            className="fixed inset-0 z-40 bg-ink-0 md:hidden"
          >
            <div className="flex h-full flex-col px-6 pt-24 pb-10">
              <div className="space-y-8">
                <Link
                  href="/dashboard/validate"
                  onClick={() => setOpen(false)}
                  className="block font-serif text-[44px] leading-none tracking-tight"
                >
                  Validate an idea
                </Link>
                <Link
                  href="#system"
                  onClick={() => setOpen(false)}
                  className="block font-serif text-[44px] leading-none tracking-tight text-bone-1"
                >
                  The system
                </Link>
                <Link
                  href="#preview"
                  onClick={() => setOpen(false)}
                  className="block font-serif text-[44px] leading-none tracking-tight text-bone-1"
                >
                  Sample memo
                </Link>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-bone-0/10 pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-bone-2">
                <span>{microcopy.brand.name}</span>
                <span className="tabular text-bone-1">
                  {counterStr} {microcopy.nav.counter}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/**
 * DigitOdometer — three-character odometer where each digit slides up when it
 * changes. Outgoing digit exits up, new digit enters from below. No bouncing.
 */
function DigitOdometer({ value }: { value: string }) {
  const chars = value.split("")
  return (
    <span className="inline-flex items-baseline">
      {chars.map((c, i) => (
        <DigitCell key={i} digit={c} />
      ))}
    </span>
  )
}

function DigitCell({ digit }: { digit: string }) {
  return (
    <span className="relative inline-block h-[1.1em] w-[0.62em] overflow-hidden text-bone-0">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.32, ease: ease.editorial }}
          className="absolute inset-0 flex items-center justify-center tabular"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function SystemFlyout() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-bone-1 transition-colors duration-200 hover:text-bone-0"
        data-cursor="read"
      >
        {microcopy.nav.secondary}
        <span className={`ml-2 inline-block transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: ease.editorial }}
            className="absolute right-0 top-[calc(100%+12px)] w-[420px] border border-bone-0/10 bg-ink-1 p-6"
          >
            <p className="mono-caption mb-5">The decision system</p>
            <div className="space-y-4">
              {microcopy.system.stages.map((s) => (
                <Link
                  key={s.n}
                  href="#system"
                  onClick={() => setOpen(false)}
                  className="group grid grid-cols-[40px_1fr] gap-4 border-t border-bone-0/[0.06] pt-4 first:border-t-0 first:pt-0"
                  data-cursor="read"
                >
                  <span className="mono-caption tabular">{s.n}</span>
                  <div>
                    <div className="text-[15px] font-medium text-bone-0 transition-transform duration-200 group-hover:translate-x-1">
                      {s.title}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-bone-1">{s.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ValidateCta() {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`
    }
    const onLeave = () => (el.style.transform = "translate(0, 0)")
    const parent = el.parentElement
    parent?.addEventListener("mousemove", onMove)
    parent?.addEventListener("mouseleave", onLeave)
    return () => {
      parent?.removeEventListener("mousemove", onMove)
      parent?.removeEventListener("mouseleave", onLeave)
    }
  }, [reduce])

  return (
    <span className="inline-block px-2 py-2">
      <Link
        ref={ref}
        href="/dashboard/validate"
        className="tab-cta inline-flex"
        data-cursor="file"
        style={{
          transition: "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), color 220ms, border-color 220ms",
        }}
      >
        <span>{microcopy.nav.cta}</span>
        <span className="tab-cta-arrow">→</span>
      </Link>
    </span>
  )
}
