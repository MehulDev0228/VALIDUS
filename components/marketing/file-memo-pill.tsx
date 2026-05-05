"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ease } from "@/lib/motion"

/**
 * FileMemoPill — persistent conversion magnet.
 *
 * Appears bottom-right after the user has scrolled past 25% of the page.
 * Magnetic field within 220px of cursor. Pulses with the same cadence as
 * the nav verdict-pulse track for brand rhythm. Single click → /validate.
 */
export function FileMemoPill() {
  const [shown, setShown] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? window.scrollY / max : 0
      setShown(ratio > 0.22 && ratio < 0.95)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Magnetic field — tuned tight so the pull feels intentional, not gravitational.
  useEffect(() => {
    if (reduce) return
    const wrap = wrapRef.current
    if (!wrap) return
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const force = Math.max(0, 1 - dist / 240)
      const tx = dx * 0.18 * force
      const ty = dy * 0.18 * force
      wrap.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
    }
    document.addEventListener("mousemove", onMove)
    return () => document.removeEventListener("mousemove", onMove)
  }, [reduce])

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          ref={wrapRef}
          initial={{ opacity: 0, y: 24, x: 24 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 24, x: 24 }}
          transition={{ duration: 0.55, ease: ease.editorial }}
          className="fixed bottom-8 right-8 z-40"
          style={{ willChange: "transform" }}
        >
          <Link href="/auth?next=/dashboard/validate" className="tab-cta" data-cursor="file">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-bone-0/30" />
              <motion.span
                className="absolute inset-0 rounded-full bg-bone-0"
                animate={reduce ? undefined : { scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <span>File a memo</span>
            <span className="tab-cta-arrow">→</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
