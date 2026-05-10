"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function HeroSpotlight({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty("--sx", `${e.clientX - r.left}px`)
    el.style.setProperty("--sy", `${e.clientY - r.top}px`)
  }

  return (
    <div className={cn("relative isolate overflow-hidden", className)} onMouseMove={onMove}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(680px circle at var(--sx, 50%) var(--sy, 35%), rgb(6 182 212 / 0.14), transparent 55%)",
        }}
      />
      {children}
    </div>
  )
}
