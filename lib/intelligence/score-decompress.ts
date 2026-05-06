/** Break LLM score compression (e.g. endless 52 / 0.64) with deterministic, decision-aware spread */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export type DecisionLean = "BUILD" | "PIVOT" | "KILL"

export function decompressValidationMetrics(args: {
  opportunityScoreRaw: number
  confidenceRaw: number
  decision: DecisionLean
  salt: number
  /** 0–1 from founder asymmetry — widens pivots/upside spread without nuking realism */
  founderUpsideBoost?: number
}): { opportunityScore: number; confidence: number } {
  const salt = args.salt >>> 0
  const r1 = (salt % 997) / 997
  const r2 = ((salt >> 7) % 991) / 991
  const r3 = ((salt >> 13) % 983) / 983
  const upside = clamp(Number(args.founderUpsideBoost ?? 0), 0, 1)

  const rawO = clamp(Number(args.opportunityScoreRaw || 50), 0, 100)
  const rawC = clamp(Number(args.confidenceRaw || 0.64), 0.25, 0.94)

  let targetO = rawO
  if (args.decision === "BUILD") {
    targetO = 64 + Math.floor(r1 * 28) + ((salt >> 3) % 9) - 4 + Math.floor(upside * 12)
    targetO = clamp(targetO, 57, 95)
  } else if (args.decision === "KILL") {
    targetO = 12 + Math.floor(r2 * 36) + ((salt >> 5) % 7) - 3
    targetO = clamp(targetO, 5, 54)
  } else {
    targetO =
      28 +
      Math.floor(r3 * 56) +
      ((salt >> 11) % 21) -
      6 +
      Math.floor(upside * 26)
    targetO = clamp(targetO, 18, 91)
  }

  const opportunityScore = clamp(
    Math.round(0.28 * rawO + 0.72 * targetO),
    args.decision === "KILL" ? 5 : 14,
    args.decision === "BUILD" ? 97 : 94,
  )

  let targetC = rawC
  if (args.decision === "BUILD") targetC = 0.69 + r1 * 0.23
  else if (args.decision === "KILL") targetC = 0.56 + r2 * 0.27
  else targetC = 0.48 + r3 * 0.36

  const confidence = clamp(0.42 * rawC + 0.58 * targetC, 0.43, 0.92)

  return { opportunityScore, confidence }
}
