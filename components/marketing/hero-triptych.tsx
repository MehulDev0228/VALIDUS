"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

/**
 * HeroTriptych — the trial begins.
 *
 * Entry sequence (≈1.4s on a fresh page load):
 *   ▸ A live UTC stamp pulses "DELIBERATING…" above the headline.
 *   ▸ Three bone-white redaction bars cover the headline lines and retract
 *     one at a time (left → right → left) as if peeling off a sealed file.
 *   ▸ The status flips to "VERDICT FILED" in build-green for 400ms, then
 *     settles to "ON FILE".
 *   ▸ Subhead, CTAs, and the verdict triptych enter.
 *
 * The triptych is magnetic with a judgment metaphor: the closest card to
 * the cursor lifts and lights an accent rule beneath it (in its verdict
 * tone); the other two dim and back away physically. Mouse-leave snaps to
 * a quiet neutral state.
 */
export function HeroTriptych() {
  const reduce = useReducedMotion()
  const [stamp, setStamp] = useState<string>("")
  const [status, setStatus] = useState<"deliberating" | "filed" | "rest">("deliberating")
  const [headlineParallaxY, setHeadlineParallaxY] = useState(0)

  // Live UTC clock for the file marker.
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      const dd = String(d.getUTCDate()).padStart(2, "0")
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
      const yy = String(d.getUTCFullYear()).slice(2)
      const hh = String(d.getUTCHours()).padStart(2, "0")
      const mi = String(d.getUTCMinutes()).padStart(2, "0")
      const ss = String(d.getUTCSeconds()).padStart(2, "0")
      return `${dd}.${mm}.${yy} · ${hh}:${mi}:${ss} UTC`
    }
    setStamp(fmt())
    const id = setInterval(() => setStamp(fmt()), 1000)
    return () => clearInterval(id)
  }, [])

  // Status choreography for the redaction reveal.
  useEffect(() => {
    if (reduce) {
      setStatus("rest")
      return
    }
    const t1 = setTimeout(() => setStatus("filed"), 1100)
    const t2 = setTimeout(() => setStatus("rest"), 1700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [reduce])

  useEffect(() => {
    if (reduce) return
    const onMove = (e: MouseEvent) => {
      const viewportH = window.innerHeight || 1
      const normalized = (e.clientY / viewportH - 0.5) * 2
      setHeadlineParallaxY(normalized * 6)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [reduce])

  return (
    <section
      id="hero"
      data-section="hero"
      className="relative isolate overflow-hidden border-b border-bone-0/[0.06] pt-32 pb-24 md:pt-40 md:pb-32"
    >
      <div className="grid-architecture pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_55%,transparent_100%)]" />

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10">
        {/* Forensic file marker */}
        <div className="mb-10 flex items-center gap-3">
          <motion.span
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: ease.editorial }}
            className="inline-block h-px w-10 bg-bone-0"
          />
          <span className="mono-caption tabular flex items-center gap-3">
            <span className="text-bone-2">FILE</span>
            <span className="text-bone-0">{stamp || "—"}</span>
            <span className="text-bone-2">·</span>
            <StatusLabel status={status} />
          </span>
        </div>

        <motion.h1
          className="display-xl text-[clamp(56px,11vw,148px)] font-medium text-bone-0"
          data-cursor="read"
          animate={reduce ? undefined : { y: headlineParallaxY }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <RedactedLine text={microcopy.hero.headlineLines[0]} delay={0.15} sweepFrom="left" reduce={!!reduce} />
          <RedactedLine text={microcopy.hero.headlineLines[1]} delay={0.4} sweepFrom="right" italic reduce={!!reduce} />
          <RedactedLine text={microcopy.hero.headlineLines[2]} delay={0.65} sweepFrom="left" reduce={!!reduce} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0, ease: ease.editorial }}
          className="mt-10 max-w-[560px] text-[17px] leading-[1.55] text-bone-1"
          data-cursor="read"
        >
          {microcopy.hero.subhead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15, ease: ease.editorial }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <Link href="/auth?next=/dashboard/validate" className="tab-cta" data-cursor="file">
            <span>{microcopy.hero.ctaPrimary}</span>
            <span className="tab-cta-arrow">→</span>
          </Link>
          <Link href="#preview" className="tab-cta tab-cta-quiet" data-cursor="read">
            <span>{microcopy.hero.ctaSecondary}</span>
            <span className="tab-cta-arrow">↓</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3, ease: ease.editorial }}
          className="mt-20"
        >
          <MagneticTriptych reduce={!!reduce} />
        </motion.div>
      </div>
    </section>
  )
}

function StatusLabel({ status }: { status: "deliberating" | "filed" | "rest" }) {
  if (status === "filed") {
    return <span className="text-verdict-build">VERDICT FILED</span>
  }
  if (status === "rest") {
    return <span className="text-bone-0">ON FILE</span>
  }
  return (
    <span className="text-bone-0">
      DELIBERATING<DotPulse />
    </span>
  )
}

function DotPulse() {
  // Three dots fade in/out in sequence — handcrafted, not a CSS spinner.
  const dots = useMemo(() => [0, 1, 2], [])
  return (
    <span className="inline-flex" aria-hidden>
      {dots.map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          className="ml-0.5"
        >
          .
        </motion.span>
      ))}
    </span>
  )
}

function RedactedLine({
  text,
  delay,
  italic,
  sweepFrom,
  reduce,
}: {
  text: string
  delay: number
  italic?: boolean
  sweepFrom: "left" | "right"
  reduce: boolean
}) {
  // The redaction bar sits over the line at full width and retracts to zero.
  // `originX` controls which side the bar peels away from, alternating per line.
  const originX = sweepFrom === "left" ? 0 : 1
  return (
    <span className="relative block overflow-hidden">
      <span className={italic ? "block font-serif font-normal italic text-bone-0" : "block font-sans"}>{text}</span>
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 left-0 right-0 bg-bone-0"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.55, delay, ease: ease.editorial }}
          style={{ originX, transformOrigin: `${originX === 0 ? "left" : "right"} center` }}
        />
      )}
    </span>
  )
}

function MagneticTriptych({ reduce }: { reduce: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<Array<HTMLDivElement | null>>([])
  const claimsRef = useRef<Array<HTMLSpanElement | null>>([])
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    if (reduce) return
    const container = containerRef.current
    if (!container) return

    let raf = 0
    const targetTransforms: Array<{ tx: number; ty: number; s: number }> = [
      { tx: 0, ty: 0, s: 1 },
      { tx: 0, ty: 0, s: 1 },
      { tx: 0, ty: 0, s: 1 },
    ]
    const currentTransforms = targetTransforms.map((t) => ({ ...t }))
    let mouse = { x: -9999, y: -9999, inside: false }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.inside = true
    }
    const onLeave = () => {
      mouse.inside = false
    }

    const tick = () => {
      // Compute distances and the closest index.
      let closest = -1
      let closestDist = Infinity
      const dists: number[] = []
      cardsRef.current.forEach((card, i) => {
        if (!card) {
          dists[i] = Infinity
          return
        }
        const r = card.getBoundingClientRect()
        const ccx = r.left + r.width / 2
        const ccy = r.top + r.height / 2
        const dx = mouse.x - ccx
        const dy = mouse.y - ccy
        const d = Math.hypot(dx, dy)
        dists[i] = d
        if (mouse.inside && d < closestDist) {
          closestDist = d
          closest = i
        }
      })

      // Set targets per card based on whether it's the chosen one or pushed away.
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        if (!mouse.inside) {
          targetTransforms[i] = { tx: 0, ty: 0, s: 1 }
          return
        }
        const r = card.getBoundingClientRect()
        const ccx = r.left + r.width / 2
        const ccy = r.top + r.height / 2
        const dx = mouse.x - ccx
        const dy = mouse.y - ccy
        const d = dists[i]
        if (i === closest) {
          // Pull toward cursor, lift up.
          const prox = Math.max(0, 1 - d / 480)
          const tx = (dx / r.width) * 12 * prox
          const ty = (dy / r.height) * 8 * prox - 6 * prox
          targetTransforms[i] = { tx, ty, s: 1 + 0.018 * prox }
        } else {
          // Back away from cursor.
          const push = Math.max(0, 1 - d / 720)
          const tx = -(dx / r.width) * 8 * push
          const ty = -(dy / r.height) * 6 * push + 2 * push
          targetTransforms[i] = { tx, ty, s: 1 - 0.012 * push }
        }
      })

      // Lerp current toward target and apply.
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        const c = currentTransforms[i]
        const t = targetTransforms[i]
        c.tx += (t.tx - c.tx) * 0.18
        c.ty += (t.ty - c.ty) * 0.18
        c.s += (t.s - c.s) * 0.18
        card.style.transform = `translate3d(${c.tx.toFixed(2)}px, ${c.ty.toFixed(2)}px, 0) scale(${c.s.toFixed(4)})`
      })

      // Draw / retract claim line.
      claimsRef.current.forEach((rule, i) => {
        if (!rule) return
        const wantOn = mouse.inside && i === closest
        rule.style.transform = wantOn ? "scaleX(1)" : "scaleX(0)"
      })

      if (closest !== activeIdx) setActiveIdx(closest)

      raf = requestAnimationFrame(tick)
    }

    container.addEventListener("mousemove", onMove)
    container.addEventListener("mouseleave", onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener("mousemove", onMove)
      container.removeEventListener("mouseleave", onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce])

  const cards = [
    {
      label: "BUILD",
      caption: microcopy.hero.triptychSubs[0],
      tone: "build" as const,
      cursor: "approves",
      number: "01",
    },
    {
      label: "PIVOT",
      caption: microcopy.hero.triptychSubs[1],
      tone: "pivot" as const,
      cursor: "pivots",
      number: "02",
    },
    {
      label: "KILL",
      caption: microcopy.hero.triptychSubs[2],
      tone: "kill" as const,
      cursor: "denies",
      number: "03",
    },
  ]

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-3"
    >
      {cards.map((c, i) => {
        const ringTone =
          c.tone === "build"
            ? "bg-verdict-build"
            : c.tone === "pivot"
            ? "bg-verdict-pivot"
            : "bg-verdict-kill"
        const textTone =
          c.tone === "build"
            ? "text-verdict-build"
            : c.tone === "pivot"
            ? "text-verdict-pivot"
            : "text-verdict-kill"
        const dimmed = activeIdx !== -1 && activeIdx !== i

        return (
          <div
            key={c.label}
            ref={(el) => {
              cardsRef.current[i] = el
            }}
            data-cursor={c.cursor}
            className="group relative flex aspect-[5/3] flex-col justify-between bg-ink-0 p-8 will-change-transform md:aspect-[4/5] md:p-10"
            style={{ transition: "filter 320ms cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className={`mono-caption tabular ${dimmed ? "text-bone-2" : "text-bone-1"}`}>{c.number}</span>
              <span className={`h-1.5 w-1.5 ${ringTone}`} />
            </div>

            <div>
              <div
                className={`font-sans text-[clamp(48px,5vw,72px)] font-semibold leading-none tracking-[-0.04em] ${textTone} ${
                  dimmed ? "opacity-60" : "opacity-100"
                }`}
                style={{ transition: "opacity 320ms cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {c.label}
              </div>
              <div
                className={`mt-3 text-[14px] leading-snug ${dimmed ? "text-bone-2" : "text-bone-1"}`}
                style={{ transition: "color 320ms cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {c.caption}
              </div>
            </div>

            {/* Claim rule — drawn under the active card in its verdict tone. */}
            <span
              ref={(el) => {
                claimsRef.current[i] = el
              }}
              aria-hidden
              className={`pointer-events-none absolute inset-x-8 bottom-0 h-px origin-left ${ringTone}`}
              style={{
                transform: "scaleX(0)",
                transition: "transform 360ms cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
