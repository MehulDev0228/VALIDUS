"use client"

import { motion } from "framer-motion"
import { ease } from "@/lib/motion"

/**
 * Route sweep — a 1px horizontal hairline that travels across the top of
 * the viewport on every route change. Quiet, editorial signal that the
 * room is shifting. No full-screen mask — that's the chamber curtain's job.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
        transition={{ duration: 0.9, ease: ease.editorial, times: [0, 0.5, 1] }}
        className="fixed left-0 right-0 top-0 z-[90] h-px origin-left bg-ember/40"
        aria-hidden
      />
      {children}
    </>
  )
}
