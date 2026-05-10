"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Conic-gradient border that rotates — wrap primary CTAs.
 */
export function MovingBorder({
  className,
  innerClassName,
  children,
}: {
  className?: string
  innerClassName?: string
  children: ReactNode
}) {
  return (
    <div className={cn("relative rounded-xl p-px", className)}>
      <div
        aria-hidden
        className="moving-border-rotate absolute -inset-[120%] opacity-90"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, rgb(6 182 212 / 0.35) 15%, rgb(34 211 238 / 0.5) 30%, transparent 45%, transparent 100%)",
        }}
      />
      <div
        className={cn(
          "relative rounded-[11px] bg-ink-0/95 px-5 py-3 backdrop-blur-sm",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
