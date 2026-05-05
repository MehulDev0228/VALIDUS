/**
 * Shared motion vocabulary for FutureValidate.
 * Easings reference physical drag (mass + friction) instead of generic eases.
 */

export const ease = {
  /** Editorial — primary curve for reveals, CTAs, panels. */
  editorial: [0.32, 0.72, 0, 1] as const,
  /** Hover — symmetric, fast in/out for micro-interactions. */
  hover: [0.6, 0, 0.4, 1] as const,
  /** Sweep — long page-level transitions. */
  sweep: [0.65, 0, 0.35, 1] as const,
}

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: ease.editorial },
}

export const fadeUpStagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: ease.editorial, delay: 0.05 * i },
})

export const letterReveal = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: ease.editorial, delay: 0.04 * i },
})
