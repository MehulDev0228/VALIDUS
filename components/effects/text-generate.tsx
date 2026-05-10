"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ease } from "@/lib/motion"

export function TextGenerate({
  text,
  className,
  wordDelay = 0.06,
}: {
  text: string
  className?: string
  wordDelay?: number
}) {
  const reduce = useReducedMotion()
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text])

  if (reduce) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.38, delay: i * wordDelay, ease: ease.editorial }}
          className="inline-block whitespace-pre"
        >
          {w}
          {i < words.length - 1 ? "\u00A0" : null}
        </motion.span>
      ))}
    </span>
  )
}
