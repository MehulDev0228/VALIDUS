"use client"

import { ReactLenis, useLenis } from "lenis/react"
import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

/**
 * LenisProvider — global smooth-scroll fabric.
 *
 * Scrolling should feel like moving through thought, not flicking pages.
 *
 *   - duration ~1.4s with the cubic settle curve to feel weighted
 *   - lerp left at default; duration carries the inertia
 *   - touchMultiplier softened so mobile inertia matches desktop calm
 *   - smoothWheel only — touch keeps native rubberband (don't fight iOS)
 *   - bypassed entirely under prefers-reduced-motion
 *   - reset to top on every route change so chamber transitions feel intentional
 *
 * Mounted once near the root. Children render normally — the wrapper
 * just hijacks the scroll surface beneath them.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const [reduce, setReduce] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  if (reduce === null || reduce) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.4,
        easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
        smoothWheel: true,
        touchMultiplier: 1.6,
        wheelMultiplier: 0.9,
      }}
    >
      <RouteScrollReset />
      {children}
    </ReactLenis>
  )
}

/**
 * Resets Lenis to the top on every pathname change. Without this, chamber
 * transitions can land mid-page and feel disorienting.
 */
function RouteScrollReset() {
  const pathname = usePathname()
  const lenis = useLenis()
  useEffect(() => {
    if (!lenis) return
    lenis.scrollTo(0, { immediate: true })
  }, [pathname, lenis])
  return null
}
