/**
 * VERDIKT motion vocabulary.
 *
 * "Inevitable, not impressive."
 * Every motion should feel like it was always going to happen —
 * like gravity, not fireworks.
 */

export const ease = {
  /** Breath — primary reveals, page enters. Calm, inevitable. */
  editorial: [0.25, 0.1, 0.25, 1] as const,
  /** Settle — panel opens, content shifts. Purposeful deceleration. */
  settle: [0.32, 0.72, 0, 1] as const,
  /** Touch — hover states, micro-interactions. Quick, tactile. */
  hover: [0.4, 0, 0.2, 1] as const,
  /** Drift — ambient motion, background movement. Glacial, atmospheric. */
  drift: [0.16, 1, 0.3, 1] as const,
}

/**
 * Timing tiers — Linear/Stripe-pace, not cinema-pace. Reveals stay
 * under one second by default. The product should feel fast.
 *
 *   tiny       100-180ms   pointer-down feedback, focus rings
 *   hover      180-260ms   color, opacity, border on hover
 *   section    420-780ms   whileInView reveals, headline entries
 *
 * Each tier has min/mid/max so a section can vary internally.
 */
export const timing = {
  tiny: { min: 0.1, mid: 0.14, max: 0.18 },
  hover: { min: 0.18, mid: 0.22, max: 0.26 },
  section: { min: 0.42, mid: 0.6, max: 0.78 },
} as const

/**
 * Spring presets — for physics-based interactions (magnetic field,
 * cursor tilt, fragment drift). Calibrated for "weighted glass":
 * fast enough to feel responsive, slow enough to feel inertial.
 */
export const spring = {
  /** Magnetic field — pulls toward target, eases back. Tight. */
  magnetic: { stiffness: 220, damping: 28, mass: 0.9 },
  /** Memo tilt — perspective rotation. Slow, weighted. */
  tilt: { stiffness: 90, damping: 22, mass: 1.2 },
  /** Fragment pull — floating panel reaction to cursor. Loose. */
  fragment: { stiffness: 60, damping: 18, mass: 1.0 },
  /** Local light tracking — radial spot following cursor. */
  light: { stiffness: 110, damping: 30, mass: 0.7 },
} as const

export const duration = {
  touch: timing.tiny.max,
  settle: timing.hover.max,
  breath: timing.section.min,
  drift: 1.2,
}

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.breath, ease: ease.editorial },
}

export const fadeUpStagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.breath, ease: ease.editorial, delay: 0.06 * i },
})

export const gentleReveal = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.settle, ease: ease.editorial, delay: 0.05 * i },
})

/** Scroll-triggered reveal — gentler than a hard pop-in */
export const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-15%" },
  transition: { duration: 0.8, ease: ease.editorial },
}
