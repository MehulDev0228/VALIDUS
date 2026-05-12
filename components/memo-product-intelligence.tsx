"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { VerdictLean } from "@/lib/founder-memory/types"

const DWELL_FLUSH_MS = 4500

async function flushProductEvents(events: Array<Record<string, unknown>>) {
  if (events.length === 0 || typeof window === "undefined") return
  try {
    await fetch("/api/product-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ events }),
    })
  } catch {
    /** soft fail */
  }
}

/**
 * Non-invasive observers for memo resonance — authenticated writes only elsewhere.
 */
export function MemoProductSignals({
  ideaId,
  ideaKey,
  verdict,
  children,
}: {
  ideaId: string | null
  ideaKey?: string | null
  verdict: VerdictLean
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)
  const queueRef = useRef<Array<Record<string, unknown>>>([])
  const dwellRef = useRef<Map<string, { start: number; visible: boolean }>>(new Map())
  const flushedRef = useRef(false)

  const enqueue = useCallback(
    (e: Record<string, unknown>) => {
      if (!user?.id) return
      queueRef.current.push({
        ideaId: ideaId ?? undefined,
        ideaKey: ideaKey ?? undefined,
        verdict,
        ...e,
      })
      if (queueRef.current.length >= 10) {
        const batch = queueRef.current.splice(0, queueRef.current.length)
        void flushProductEvents(batch)
      }
    },
    [user?.id, ideaId, ideaKey, verdict],
  )

  const flushQueue = useCallback(() => {
    const batch = queueRef.current.splice(0, queueRef.current.length)
    void flushProductEvents(batch)
  }, [])

  /** First vs repeat open — only when signed in so local visit counts align with telemetry */
  useEffect(() => {
    if (!ideaId || !user?.id) return
    try {
      const k = `fv_pi_memo_visits_${ideaId}`
      const prev = Number.parseInt(localStorage.getItem(k) || "0", 10) || 0
      const next = prev + 1
      localStorage.setItem(k, String(next))
      enqueue({ kind: next > 1 ? "memo_revisit" : "memo_first_open" })
      const id = window.setInterval(flushQueue, 25_000)
      return () => {
        clearInterval(id)
        flushQueue()
      }
    } catch {
      return undefined
    }
  }, [ideaId, user?.id, enqueue, flushQueue])

  /** Section dwell */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !ideaId || !user?.id) return

    const dwellMap = dwellRef.current

    const obs = new IntersectionObserver(
      (entries) => {
        const now = Date.now()
        for (const en of entries) {
          const id = (en.target as HTMLElement).dataset.piSection
          if (!id) continue
          const st = dwellMap.get(id) ?? { start: now, visible: false }
          if (en.isIntersecting) {
            st.visible = true
            st.start = now
            dwellMap.set(id, st)
          } else if (st.visible) {
            const ms = now - st.start
            dwellMap.delete(id)
            if (ms >= DWELL_FLUSH_MS) {
              enqueue({ kind: "section_dwell", sectionId: id, dwellMs: Math.min(ms, 600_000) })
            }
          }
        }
      },
      { threshold: [0.35, 0.55] },
    )

    root.querySelectorAll<HTMLElement>("[data-pi-section]").forEach((el) => obs.observe(el))

    return () => {
      obs.disconnect()
      const now = Date.now()
      for (const [id, st] of dwellMap.entries()) {
        if (!st.visible) continue
        const ms = now - st.start
        if (ms >= DWELL_FLUSH_MS) {
          enqueue({ kind: "section_dwell", sectionId: id, dwellMs: Math.min(ms, 600_000) })
        }
      }
      dwellMap.clear()
    }
  }, [ideaId, user?.id, enqueue])

  /** Specialist notes expand */
  useEffect(() => {
    const el = document.getElementById("fv-memo-specialist-details") as HTMLDetailsElement | null
    if (!el || !user?.id) return
    const onToggle = () => {
      enqueue({
        kind: el.open ? "specialist_notes_expand" : "specialist_notes_collapse",
        sectionId: "specialist_notes",
      })
    }
    el.addEventListener("toggle", onToggle)
    return () => el.removeEventListener("toggle", onToggle)
  }, [enqueue, user?.id])

  useEffect(() => {
    const onHide = () => {
      if (flushedRef.current) return
      flushedRef.current = true
      flushQueue()
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide()
    })
    window.addEventListener("pagehide", onHide)
    return () => {
      window.removeEventListener("pagehide", onHide)
    }
  }, [flushQueue])

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  )
}
