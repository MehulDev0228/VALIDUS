"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ease } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function FlipWords({
  words,
  intervalMs = 2800,
  className,
}: {
  words: string[]
  intervalMs?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce || words.length <= 1) return
    const id = setInterval(() => setI((v) => (v + 1) % words.length), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, reduce, words.length])

  if (reduce || words.length <= 1) {
    return <span className={className}>{words[0]}</span>
  }

  return (
    <span className={cn("relative inline-block min-w-[5ch] text-ember", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.32, ease: ease.editorial }}
          className="inline-block"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
