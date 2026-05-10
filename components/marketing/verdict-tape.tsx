"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"

type Sample = {
  id: string
  verdict: "BUILD" | "PIVOT" | "KILL"
  industry: string
  geo: string
  blurb: string
}

const SAMPLES: Sample[] = [
  { id: "FV-2294", verdict: "KILL",  industry: "Edu-tech",      geo: "IN", blurb: "Saturated, low willingness to pay, distribution unclear." },
  { id: "FV-2295", verdict: "PIVOT", industry: "Climate SaaS",  geo: "DE", blurb: "Real pain, wrong buyer. Sell to the CFO, not the engineer." },
  { id: "FV-2296", verdict: "BUILD", industry: "Vertical AI",   geo: "US", blurb: "Narrow wedge, sticky workflow, no incumbent that cares." },
  { id: "FV-2297", verdict: "KILL",  industry: "Crypto",        geo: "SG", blurb: "Solution looking for a problem. Token logic does not survive contact." },
  { id: "FV-2298", verdict: "PIVOT", industry: "Healthcare",    geo: "UK", blurb: "Compliance kills the consumer wedge. B2B2C is the only path." },
  { id: "FV-2299", verdict: "BUILD", industry: "Dev tools",     geo: "US", blurb: "Painful, daily, paid. Seven design partners is not luck." },
  { id: "FV-2300", verdict: "KILL",  industry: "Marketplace",   geo: "BR", blurb: "Cold-start economics broken. Liquidity dies before take-rate matters." },
  { id: "FV-2301", verdict: "PIVOT", industry: "Fin-ops",       geo: "AE", blurb: "Right pain, wrong wedge. Lead with reconciliation, not forecasting." },
]

/**
 * VerdictTape
 *
 * Custom JS-driven marquee that responds to the user:
 *   ▸ Default state: slow leftward drift (≈40px/s).
 *   ▸ When the cursor is inside the tape: scroll velocity tracks the cursor's
 *     horizontal velocity. Move right → tape rolls right, faster moves → faster
 *     scroll. Stop → tape eases back to drift.
 *   ▸ Click + drag inside the tape: manual scrub with elastic decay on release.
 *
 * Total track width = 2× SAMPLES so we can wrap seamlessly. Position is kept
 * modulo half-width and applied imperatively — no CSS keyframes.
 */
export function VerdictTape() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Imperative state lives in refs so the RAF loop doesn't trigger renders.
  const positionRef = useRef(0) // current translateX in px (always negative when scrolling left)
  const velocityRef = useRef(-40) // current px/s
  const targetVelocityRef = useRef(-40) // px/s the system is easing toward
  const halfWidthRef = useRef(0)
  const lastMouseXRef = useRef(0)
  const lastMouseTRef = useRef(0)
  const insideRef = useRef(false)
  const draggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const dragVelocityRef = useRef(0)
  const lastDragTRef = useRef(0)
  const [grabState, setGrabState] = useState<"idle" | "grab" | "grabbing">("idle")

  useEffect(() => {
    const wrap = wrapRef.current
    const track = trackRef.current
    if (!wrap || !track) return

    const measure = () => {
      halfWidthRef.current = track.scrollWidth / 2
    }
    measure()
    window.addEventListener("resize", measure)

    const DRIFT = -40 // base px/s leftward drift
    const MAX_SPEED = 1800 // hard cap so flicks don't fling off-screen
    let last = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) // clamp dt for tab switches
      last = now

      if (draggingRef.current) {
        // Position is being controlled directly by the drag handler.
      } else {
        // Ease velocity toward target.
        const target = insideRef.current ? targetVelocityRef.current : DRIFT
        const lerp = insideRef.current ? 0.18 : 0.06
        velocityRef.current += (target - velocityRef.current) * lerp
        if (Math.abs(velocityRef.current) > MAX_SPEED) {
          velocityRef.current = Math.sign(velocityRef.current) * MAX_SPEED
        }
        positionRef.current += velocityRef.current * dt
      }

      // Wrap modulo half-width so the loop is seamless.
      const half = halfWidthRef.current || 1
      while (positionRef.current <= -half) positionRef.current += half
      while (positionRef.current > 0) positionRef.current -= half

      track.style.transform = `translate3d(${positionRef.current.toFixed(2)}px, 0, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onEnter = () => {
      insideRef.current = true
      lastMouseTRef.current = performance.now()
      setGrabState((s) => (s === "idle" ? "grab" : s))
    }
    const onLeave = () => {
      insideRef.current = false
      targetVelocityRef.current = DRIFT
      if (!draggingRef.current) setGrabState("idle")
    }

    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      const dt = Math.max(8, now - lastMouseTRef.current) / 1000
      const dx = e.clientX - lastMouseXRef.current
      const v = dx / dt // px/s of the cursor

      if (draggingRef.current) {
        const delta = e.clientX - dragStartXRef.current
        positionRef.current = dragStartPosRef.current + delta
        dragVelocityRef.current = v
      } else if (insideRef.current) {
        // Map cursor velocity to scroll velocity. Right cursor = right tape.
        // Multiplier > 1 amplifies intent so small flicks feel responsive.
        targetVelocityRef.current = v * 1.6
      }

      lastMouseXRef.current = e.clientX
      lastMouseTRef.current = now
    }

    const onDown = (e: MouseEvent) => {
      draggingRef.current = true
      dragStartXRef.current = e.clientX
      dragStartPosRef.current = positionRef.current
      lastDragTRef.current = performance.now()
      dragVelocityRef.current = 0
      setGrabState("grabbing")
    }
    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      // Hand the released velocity to the easing system for inertia.
      velocityRef.current = dragVelocityRef.current
      targetVelocityRef.current = insideRef.current ? 0 : DRIFT
      setGrabState(insideRef.current ? "grab" : "idle")
    }

    wrap.addEventListener("mouseenter", onEnter)
    wrap.addEventListener("mouseleave", onLeave)
    wrap.addEventListener("mousemove", onMove)
    wrap.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measure)
      wrap.removeEventListener("mouseenter", onEnter)
      wrap.removeEventListener("mouseleave", onLeave)
      wrap.removeEventListener("mousemove", onMove)
      wrap.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  const doubled = [...SAMPLES, ...SAMPLES]

  return (
    <section
      data-section="tape"
      aria-label="Recent reads"
      className="relative border-b border-bone-0/[0.04] py-10"
    >
      <div className="mx-auto mb-6 flex max-w-[1440px] items-center justify-between px-6 md:px-10">
        <p className="mono-caption text-ember/60">{microcopy.tape.eyebrow}</p>
        <p className="mono-caption hidden text-bone-2 md:block">drag to scrub · move to scroll</p>
      </div>
      <div
        ref={wrapRef}
        data-cursor="drag"
        className="relative overflow-hidden select-none"
        style={{
          cursor: reduce ? "default" : grabState === "grabbing" ? "grabbing" : grabState === "grab" ? "grab" : "default",
        }}
      >
        <div ref={trackRef} className="flex w-max gap-12 will-change-transform">
          {doubled.map((s, i) => (
            <SampleCard key={`${s.id}-${i}`} s={s} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink-0 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink-0 to-transparent" />
      </div>
    </section>
  )
}

function SampleCard({ s }: { s: Sample }) {
  const tone =
    s.verdict === "BUILD"
      ? "text-verdict-build"
      : s.verdict === "PIVOT"
      ? "text-verdict-pivot"
      : "text-verdict-kill"
  return (
    <div className="flex w-[420px] shrink-0 items-start gap-5 border-l border-bone-0/[0.06] pl-6 transition-colors hover:bg-bone-0/[0.02]">
      <span className={`font-sans text-[28px] font-semibold leading-none tracking-[-0.03em] ${tone}`}>{s.verdict}</span>
      <div className="min-w-0 flex-1">
        <div className="mono-caption mb-1 flex items-center gap-3">
          <span>{s.id}</span>
          <span className="h-px w-4 bg-bone-0/20" />
          <span>{s.industry}</span>
          <span className="h-px w-4 bg-bone-0/20" />
          <span>{s.geo}</span>
        </div>
        <p className="text-[14px] leading-snug text-bone-1">{s.blurb}</p>
      </div>
    </div>
  )
}
