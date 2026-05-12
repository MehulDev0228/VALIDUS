"use client"

import { cn } from "@/lib/utils"

type Verdict = "BUILD" | "PIVOT" | "KILL"

function verdictStrokeClass(v: Verdict): string {
  if (v === "BUILD") return "text-verdict-build"
  if (v === "KILL") return "text-verdict-kill"
  return "text-verdict-pivot"
}

/** Circular compression gauge — 0–100 opportunity score. */
export function ScoreGauge({
  score,
  verdict,
  size = 112,
  className,
}: {
  score: number
  verdict: Verdict
  size?: number
  className?: string
}) {
  const s = Math.max(0, Math.min(100, Math.round(score)))
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c * (1 - s / 100)
  const strokeCls = verdictStrokeClass(verdict)

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgb(var(--bone-2) / 0.12)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          className={cn(strokeCls, "transition-[stroke-dashoffset] duration-1000 ease-out")}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-[clamp(26px,4vw,34px)] font-semibold tabular tracking-[-0.03em]">
          {s}
        </span>
        <span className="mono-caption text-bone-2">/100</span>
      </div>
    </div>
  )
}
