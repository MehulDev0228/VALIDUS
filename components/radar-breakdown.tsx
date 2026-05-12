"use client"

import { cn } from "@/lib/utils"

const LABELS = [
  { key: "market", short: "MKT" },
  { key: "competition", short: "CMP" },
  { key: "monetization", short: "REV" },
  { key: "execution", short: "EXE" },
  { key: "founderFit", short: "FIT" },
] as const

export type RadarDims = Record<(typeof LABELS)[number]["key"], number>

/** Five-axis radar — values are 0–10. */
export function RadarBreakdown({
  values,
  className,
  accentClassName = "text-ember/55",
}: {
  values: RadarDims
  className?: string
  accentClassName?: string
}) {
  const cx = 100
  const cy = 100
  const maxR = 72
  const n = LABELS.length
  const pts = LABELS.map((lab, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const v = Math.max(0, Math.min(10, Number(values[lab.key] ?? 5))) / 10
    const rad = maxR * (0.25 + v * 0.75)
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a), a, short: lab.short }
  })
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z"

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("h-[200px] w-full max-w-[280px]", className)}
      aria-label="Score dimensions radar"
      role="img"
    >
      {[0.35, 0.55, 0.75, 1].map((scale, ring) => (
        <polygon
          key={ring}
          fill="none"
          stroke="rgb(var(--bone-2) / 0.08)"
          strokeWidth={1}
          points={LABELS.map((_, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2
            const rad = maxR * scale
            const x = cx + rad * Math.cos(a)
            const y = cy + rad * Math.sin(a)
            return `${x.toFixed(2)},${y.toFixed(2)}`
          }).join(" ")}
        />
      ))}
      {LABELS.map((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        const x2 = cx + maxR * Math.cos(a)
        const y2 = cy + maxR * Math.sin(a)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgb(var(--bone-2) / 0.12)"
            strokeWidth={1}
          />
        )
      })}
      <path
        d={d}
        fill="rgb(var(--ember) / 0.12)"
        stroke="currentColor"
        strokeWidth={1.5}
        className={accentClassName}
      />
      {pts.map((p, i) => (
        <text
          key={p.short}
          x={cx + (maxR + 14) * Math.cos(p.a)}
          y={cy + (maxR + 14) * Math.sin(p.a)}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-bone-2 font-mono text-[9px]"
        >
          {p.short}
        </text>
      ))}
    </svg>
  )
}
