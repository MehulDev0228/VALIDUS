"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ease } from "@/lib/motion"

/** Small persistent CTA while scrolling — no cursor tracking. */
export function FileMemoPill() {
  const [shown, setShown] = useState(false)
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

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: ease.editorial }}
          className="fixed bottom-8 right-8 z-40"
        >
          <Link href="/auth?next=/dashboard/validate" className="tab-cta shadow-md shadow-bone-0/[0.08]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-ember/40" />
              <motion.span
                className="absolute inset-0 rounded-full bg-ember"
                animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <span>Try Validate</span>
            <span className="tab-cta-arrow">→</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
