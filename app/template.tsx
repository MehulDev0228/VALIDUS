"use client"

import { motion } from "framer-motion"
import { ease } from "@/lib/motion"

/**
 * Route sweep — a 2px horizontal line that travels across the viewport
 * each time a route changes. Quiet, editorial, no full-screen masks.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
        transition={{ duration: 0.9, ease: ease.sweep, times: [0, 0.5, 1] }}
        className="fixed left-0 right-0 top-0 z-[100] h-px origin-left bg-bone-0"
        aria-hidden
      />
      {children}
    </>
  )
}
