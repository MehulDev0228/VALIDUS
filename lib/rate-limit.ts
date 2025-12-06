// NOTE: This is an in-memory rate limiter intended as a reference implementation.
// In production on Vercel or other serverless platforms, replace this with a
// shared store (e.g., Upstash Redis, Vercel KV, or Postgres-backed counters).

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MAX_FREE_PER_DAY = 1

type Timestamp = number

const freeUsageByIp = new Map<string, Timestamp[]>()

function pruneOld(now: number, timestamps: Timestamp[]): Timestamp[] {
  return timestamps.filter((ts) => now - ts < ONE_DAY_MS)
}

export function canConsumeFreeValidation(ip: string): boolean {
  const now = Date.now()
  const existing = freeUsageByIp.get(ip) ?? []
  const recent = pruneOld(now, existing)

  return recent.length < MAX_FREE_PER_DAY
}

export function recordFreeValidation(ip: string): void {
  const now = Date.now()
  const existing = freeUsageByIp.get(ip) ?? []
  const recent = pruneOld(now, existing)
  recent.push(now)
  freeUsageByIp.set(ip, recent)
}

export function getClientIpFromRequest(request: Request & { ip?: string | null }): string {
  const hdr = request.headers.get("x-forwarded-for")
  const headerIp = hdr ? hdr.split(",")[0].trim() : null
  const ip = (request as any).ip ?? headerIp ?? "unknown"
  return ip
}
