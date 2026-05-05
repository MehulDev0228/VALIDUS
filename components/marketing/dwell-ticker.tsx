"use client"

import { useEffect, useState } from "react"

/**
 * DwellTicker — bottom-left forensic surveillance log.
 *
 * Tracks dwell time, scroll position, and current section in a quiet
 * mono caption stack. Sections are detected via `data-section="name"`
 * attributes on top-level page sections.
 */
export function DwellTicker() {
  const [time, setTime] = useState(0)
  const [pct, setPct] = useState(0)
  const [section, setSection] = useState("hero")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const start = Date.now()
    const id = window.setInterval(() => {
      setTime(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const next = max > 0 ? Math.round((window.scrollY / max) * 100) : 0
      setPct(next)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    let lastBest = ""
    const obs = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0
        let bestName = lastBest
        entries.forEach((e) => {
          const name = (e.target as HTMLElement).getAttribute("data-section") || ""
          if (e.intersectionRatio > bestRatio && name) {
            bestRatio = e.intersectionRatio
            bestName = name
          }
        })
        if (bestName && bestName !== lastBest) {
          lastBest = bestName
          setSection(bestName)
        }
      },
      { threshold: [0.15, 0.4, 0.75] },
    )

    document.querySelectorAll("[data-section]").forEach((el) => obs.observe(el))

    return () => {
      window.clearInterval(id)
      window.removeEventListener("scroll", onScroll)
      obs.disconnect()
    }
  }, [])

  if (!mounted) return null

  const mm = String(Math.floor(time / 60)).padStart(2, "0")
  const ss = String(time % 60).padStart(2, "0")

  return (
    <div
      className="fixed bottom-6 left-6 z-30 hidden flex-col gap-1 border-l border-bone-0/15 pl-3 md:flex"
      aria-hidden
    >
      <span className="mono-caption tabular">
        <span className="text-bone-2">DWELL</span>
        <span className="ml-2 text-bone-0">
          {mm}:{ss}
        </span>
      </span>
      <span className="mono-caption tabular">
        <span className="text-bone-2">POS</span>
        <span className="ml-2 text-bone-0">{String(pct).padStart(2, "0")}%</span>
      </span>
      <span className="mono-caption tabular">
        <span className="text-bone-2">SECTION</span>
        <span className="ml-2 text-bone-0">{section}</span>
      </span>
    </div>
  )
}
