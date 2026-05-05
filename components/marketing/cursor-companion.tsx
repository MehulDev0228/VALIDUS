"use client"

import { useEffect, useRef, useState } from "react"

type Role = {
  label: string
  tone: "watching" | "approves" | "denies" | "anticipating" | "reading"
}

const ROLE_MAP: Record<string, Role> = {
  approves: { label: "APPROVES", tone: "approves" },
  denies: { label: "DENIES", tone: "denies" },
  pivots: { label: "ABSTAINS", tone: "watching" },
  file: { label: "FILE — RETURN ↵", tone: "anticipating" },
  drag: { label: "DRAG — SCRUB", tone: "anticipating" },
  read: { label: "READING", tone: "reading" },
  cite: { label: "ON THE RECORD", tone: "anticipating" },
}

/**
 * CursorCompanion
 *
 * A trailing mono caption that watches the user. Reads role hints from
 * `data-cursor="..."` attributes on hover targets and reacts. After idle
 * dwell, it crossfades to nags ("WAITING." → "STILL HERE.") which makes the
 * system feel impatient — on-brand.
 *
 * Pointer-fine only. Touch/coarse pointers get nothing (correct).
 */
export function CursorCompanion() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLSpanElement>(null)
  const target = useRef({ x: -200, y: -200 })
  const current = useRef({ x: -200, y: -200 })
  const lastMove = useRef(Date.now())
  const idleStage = useRef(0)
  const [role, setRole] = useState<Role>({ label: "WATCHING", tone: "watching" })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduced) return
    setEnabled(true)

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
      lastMove.current = Date.now()
      if (idleStage.current !== 0) idleStage.current = 0

      const t = (e.target as HTMLElement | null)?.closest?.("[data-cursor]") as HTMLElement | null
      if (t) {
        const v = t.getAttribute("data-cursor") || "watching"
        setRole(ROLE_MAP[v] ?? { label: v.toUpperCase(), tone: "watching" })
      } else {
        setRole({ label: "WATCHING", tone: "watching" })
      }
    }

    const onLeave = () => setEnabled(false)
    const onEnter = () => setEnabled(true)

    let raf = 0
    const tick = () => {
      // Spring lerp toward target — smoother than CSS transitions for cursor work.
      current.current.x += (target.current.x - current.current.x) * 0.22
      current.current.y += (target.current.y - current.current.y) * 0.22
      const el = wrapRef.current
      if (el) {
        el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`
      }

      // Idle nags: 3.5s → "WAITING.", 9s → "STILL HERE."
      const idle = Date.now() - lastMove.current
      if (idle > 9000 && idleStage.current < 2) {
        idleStage.current = 2
        setRole({ label: "STILL HERE.", tone: "watching" })
      } else if (idle > 3500 && idleStage.current < 1) {
        idleStage.current = 1
        setRole({ label: "WAITING.", tone: "watching" })
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter)
    }
  }, [])

  if (!enabled) return null

  const tone =
    role.tone === "approves"
      ? "text-verdict-build"
      : role.tone === "denies"
      ? "text-verdict-kill"
      : role.tone === "anticipating"
      ? "text-bone-0"
      : role.tone === "reading"
      ? "text-bone-1"
      : "text-bone-2"

  const dot =
    role.tone === "approves"
      ? "bg-verdict-build"
      : role.tone === "denies"
      ? "bg-verdict-kill"
      : "bg-bone-0"

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed left-0 top-0 z-[60]"
      style={{ willChange: "transform" }}
      aria-hidden
    >
      <div className="absolute" style={{ left: 18, top: 16 }}>
        <div className="flex items-center gap-2">
          <span className={`block h-1 w-1 ${dot} transition-colors duration-150`} />
          <span
            ref={captionRef}
            className={`mono-caption tabular whitespace-nowrap transition-colors duration-200 ${tone}`}
          >
            {role.label}
          </span>
        </div>
      </div>
    </div>
  )
}
