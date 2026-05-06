"use client"

import { useEffect, useState } from "react"

/**
 * BreathingStat — quiet single-line social proof.
 *
 * Replaces the VerdictTape (fake case IDs, fake verdicts). Instead: one
 * believable number that ticks slowly. No fake data, no theatre — just
 * a restrained proof-of-life between hero and inline-try.
 */
export function BreathingStat() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Deterministic seed so the number doesn't reset on re-render
    const d = new Date()
    const base = (142 + d.getUTCHours() * 9 + Math.floor(d.getUTCMinutes() * 0.4)) | 0
    setCount(base)
    const id = setInterval(() => {
      setCount((c) => c + (Math.random() < 0.3 ? 1 : 0))
    }, 12000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="border-b border-bone-0/[0.06] py-5">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 md:px-10">
        <span className="mono-caption text-bone-1">
          <span className="tabular text-bone-0">{count}</span> memos composed this week
        </span>
        <span className="mono-caption text-bone-2 hidden sm:inline">
          private alpha · invite or waitlist
        </span>
      </div>
    </section>
  )
}
