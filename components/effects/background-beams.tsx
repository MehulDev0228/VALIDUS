"use client"

import { cn } from "@/lib/utils"

/**
 * Subtle diagonal light streaks — static CSS, no JS cost.
 */
export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute -left-1/2 top-0 h-full w-[200%] opacity-[0.08]"
        style={{
          background:
            "repeating-linear-gradient(105deg, transparent, transparent 80px, rgb(6 182 212) 80px, transparent 120px)",
        }}
      />
      <div
        className="absolute -left-1/3 bottom-0 h-[60%] w-[180%] opacity-[0.06]"
        style={{
          background:
            "repeating-linear-gradient(-15deg, transparent, transparent 100px, rgb(250 250 250) 100px, transparent 140px)",
        }}
      />
    </div>
  )
}
