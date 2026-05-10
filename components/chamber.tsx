"use client"

import Link from "next/link"
import { useTransitionRouter } from "next-view-transitions"
import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ease } from "@/lib/motion"

/**
 * Chamber — the "entering a cognition chamber" transition system.
 *
 * Three coordinated pieces:
 *
 *   1. <ChamberCurtain />  — mounted once globally. A full-viewport black
 *      veil that fades up when navigation toward a chamber starts, holds
 *      while the route swaps, then fades down once the destination has
 *      mounted and signalled it's settled.
 *
 *   2. <ChamberLink>       — drop-in <Link> replacement. Fires the curtain,
 *      waits for the dim to land, then navigates. Use on links that should
 *      feel like entering a private thought.
 *
 *   3. <ChamberStage>      — wraps a destination page. On mount, plays the
 *      entry choreography (typography sharpen, container expand) and tells
 *      the curtain to lift. Without this, curtain would stay closed.
 *
 * Coordination happens via two window CustomEvents:
 *   - "chamber:enter"  — fired by ChamberLink. Curtain raises.
 *   - "chamber:settle" — fired by ChamberStage on mount. Curtain falls.
 *
 * If a destination page lacks a ChamberStage, the curtain auto-lifts after
 * a 900ms safety timeout so navigation never gets stuck behind a black veil.
 */

const ENTER_EVENT = "chamber:enter"
const SETTLE_EVENT = "chamber:settle"
const CURTAIN_HOLD_MS = 480       // how long the curtain dwells before navigation
const CURTAIN_SAFETY_MS = 900     // max time curtain stays up if no settle event

/* -------------------------------------------------------------------------- */
/*  Curtain                                                                   */
/* -------------------------------------------------------------------------- */

export function ChamberCurtain() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (reduce) return

    const onEnter = () => {
      setOpen(true)
      if (safetyRef.current) clearTimeout(safetyRef.current)
      safetyRef.current = setTimeout(() => setOpen(false), CURTAIN_SAFETY_MS)
    }
    const onSettle = () => {
      if (safetyRef.current) clearTimeout(safetyRef.current)
      // Tiny delay so the destination's first paint is already behind the curtain
      // before it lifts — no flash of unstyled cognition.
      setTimeout(() => setOpen(false), 60)
    }

    window.addEventListener(ENTER_EVENT, onEnter)
    window.addEventListener(SETTLE_EVENT, onSettle)
    return () => {
      window.removeEventListener(ENTER_EVENT, onEnter)
      window.removeEventListener(SETTLE_EVENT, onSettle)
      if (safetyRef.current) clearTimeout(safetyRef.current)
    }
  }, [reduce])

  if (reduce) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="chamber-curtain"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.5, ease: ease.editorial },
          }}
          className="pointer-events-none fixed inset-0 z-[80] bg-bone-0/88 backdrop-blur-[2px]"
          style={{ willChange: "opacity" }}
        >
          {/* A single ember pulse at the center — the only thing visible
              while the curtain holds. The founder is between rooms. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0.6], scale: [0.8, 1.02, 1] }}
            transition={{ duration: 0.7, ease: ease.editorial, times: [0, 0.5, 1] }}
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember"
            style={{ boxShadow: "0 0 28px 8px rgb(14 131 157 / 0.35)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* -------------------------------------------------------------------------- */
/*  Link trigger                                                              */
/* -------------------------------------------------------------------------- */

type ChamberLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function ChamberLink({ href, onClick, ...rest }: ChamberLinkProps) {
  const router = useTransitionRouter()
  const reduce = useReducedMotion()

  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return

    // Respect modifier-clicks (open in new tab) and reduced motion — fall
    // back to a normal Link navigation.
    if (
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
      (e.button !== undefined && e.button !== 0) ||
      reduce
    ) {
      return
    }

    e.preventDefault()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(ENTER_EVENT))
    }
    setTimeout(() => {
      const target = typeof href === "string" ? href : (href as { pathname?: string })?.pathname ?? "/"
      router.push(target)
    }, CURTAIN_HOLD_MS)
  }

  return <Link href={href} onClick={handle} {...rest} />
}

/* -------------------------------------------------------------------------- */
/*  Settle — minimal hook                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Tells the chamber curtain to lift after the destination has painted.
 * Use this on existing pages that already have their own entry animations
 * — no wrapper, no compound transitions.
 *
 *   useChamberSettle()
 */
export function useChamberSettle() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(SETTLE_EVENT))
    })
    return () => cancelAnimationFrame(id)
  }, [])
}

/* -------------------------------------------------------------------------- */
/*  Stage — destination wrapper                                               */
/* -------------------------------------------------------------------------- */

/**
 * Wrap chamber destination pages with this. It plays the entry choreography
 * (typography sharpen + content settle) and signals the curtain to lift.
 *
 * Optionally takes an `eyebrow` and `title` rendered as an editorial header
 * — the founder's first sight inside the chamber.
 *
 * For existing pages that already animate their own elements, prefer
 * useChamberSettle() instead — it doesn't compound transitions.
 */
export function ChamberStage({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (typeof window === "undefined") return
    // Wait one frame so the new content has painted before the curtain lifts.
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(SETTLE_EVENT))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)", y: 12 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{
        duration: reduce ? 0.2 : 1.0,
        ease: ease.editorial,
        delay: reduce ? 0 : 0.15,
      }}
      className={className}
    >
      {(eyebrow || title || subtitle) && (
        <header className="mb-12 md:mb-16">
          {eyebrow && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: ease.editorial }}
              className="mono-caption text-ember/70"
            >
              {eyebrow}
            </motion.p>
          )}
          {title && (
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: ease.editorial }}
              className="mt-5 font-serif text-[clamp(32px,4.4vw,56px)] font-light leading-[1.08] tracking-[-0.03em] text-bone-0"
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.55, ease: ease.editorial }}
              className="mt-5 max-w-[60ch] font-serif text-[18px] leading-[1.6] text-bone-1"
            >
              {subtitle}
            </motion.p>
          )}
        </header>
      )}
      {children}
    </motion.div>
  )
}
