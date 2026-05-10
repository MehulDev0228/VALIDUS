"use client"

import { useRef } from "react"
import { useInView, useReducedMotion } from "framer-motion"
import { AnimateNumber } from "motion-number"
import { spring } from "@/lib/motion"

type AnimatedStatProps = {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
}

/**
 * Counts into view once; respects prefers-reduced-motion.
 */
export function AnimatedStat({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: AnimatedStatProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-12%" })
  const reduce = useReducedMotion()

  const grouping = decimals === 0 && Math.abs(value) >= 1000

  if (reduce) {
    const core =
      grouping && decimals === 0
        ? Math.round(value).toLocaleString("en-US")
        : decimals > 0
          ? value.toFixed(decimals)
          : String(Math.round(value))
    return (
      <span ref={ref} className={className}>
        {prefix}
        {core}
        {suffix}
      </span>
    )
  }

  const shown = inView ? value : 0

  return (
    <span ref={ref} className={className}>
      {prefix}
      <AnimateNumber
        locales="en-US"
        format={{
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: grouping,
        }}
        transition={{ type: "spring", ...spring.magnetic }}
      >
        {shown}
      </AnimateNumber>
      {suffix}
    </span>
  )
}
