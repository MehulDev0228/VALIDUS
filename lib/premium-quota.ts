// Simple in-memory global quota for subsidized premium server-proxy runs.
// In production, replace this with a shared counter (Redis / KV / DB) and
// connect it to monitoring + alerts.

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MAX_PREMIUM_SERVER_RUNS_PER_DAY = Number(process.env.MAX_PREMIUM_SERVER_RUNS_PER_DAY ?? 50)

let lastReset = Date.now()
let countToday = 0

function resetIfNeeded(now: number) {
  if (now - lastReset >= ONE_DAY_MS) {
    lastReset = now
    countToday = 0
  }
}

export function canConsumePremiumServerRun(): boolean {
  const now = Date.now()
  resetIfNeeded(now)
  return countToday < MAX_PREMIUM_SERVER_RUNS_PER_DAY
}

export function recordPremiumServerRun(): void {
  const now = Date.now()
  resetIfNeeded(now)
  countToday += 1
}
