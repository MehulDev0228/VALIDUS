const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MAX_FREE_PER_DAY = 2

export const FREE_DAILY_LIMIT = MAX_FREE_PER_DAY

type Timestamp = number

const freeUsageByKey = new Map<string, Timestamp[]>()

function pruneOld(now: number, timestamps: Timestamp[]): Timestamp[] {
  return timestamps.filter((ts) => now - ts < ONE_DAY_MS)
}

function readInMemoryCount(key: string): number {
  const now = Date.now()
  const existing = freeUsageByKey.get(key) ?? []
  const recent = pruneOld(now, existing)
  freeUsageByKey.set(key, recent)
  return recent.length
}

function recordInMemory(key: string): void {
  const now = Date.now()
  const existing = freeUsageByKey.get(key) ?? []
  const recent = pruneOld(now, existing)
  recent.push(now)
  freeUsageByKey.set(key, recent)
}

function stableHash(input: string): string {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

function buildDailyKey(rawKey: string): string {
  const dateKey = new Date().toISOString().slice(0, 10)
  return `fv:free:daily:${dateKey}:${stableHash(rawKey)}`
}

async function getUpstashRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import("@upstash/redis")
  return new Redis({ url, token })
}

/**
 * Read the current daily count for a key. Used to drive the dashboard usage
 * meter without requiring a write side-effect.
 */
export async function readFreeUsage(key: string): Promise<number> {
  const redis = await getUpstashRedis()
  if (!redis) return readInMemoryCount(key)
  const dailyKey = buildDailyKey(key)
  const count = (await redis.get<number>(dailyKey)) ?? 0
  return count
}

export async function canConsumeFreeValidation(key: string): Promise<boolean> {
  const count = await readFreeUsage(key)
  return count < MAX_FREE_PER_DAY
}

export async function recordFreeValidation(key: string): Promise<void> {
  const redis = await getUpstashRedis()
  if (!redis) {
    recordInMemory(key)
    return
  }
  const dailyKey = buildDailyKey(key)
  const count = await redis.incr(dailyKey)
  if (count === 1) {
    await redis.expire(dailyKey, Math.ceil(ONE_DAY_MS / 1000))
  }
}

export function getClientIpFromRequest(request: Request & { ip?: string | null }): string {
  const hdr = request.headers.get("x-forwarded-for")
  const headerIp = hdr ? hdr.split(",")[0].trim() : null
  const ip = (request as any).ip ?? headerIp ?? "unknown"
  return ip
}

/**
 * Build the rate-limit key.
 *
 * Authoritative key precedence:
 *   1. user id (when authenticated) — keeps the limit honest across devices
 *   2. ip + fingerprint (anonymous fallback)
 */
export function buildRateLimitKey(args: {
  userId?: string | null
  ip?: string | null
  fingerprint?: string | null
}): string {
  if (args.userId) return `user:${args.userId}`
  return `anon:${args.ip || "unknown"}::${args.fingerprint || "no-fp"}`
}

export function secondsUntilUtcMidnight(): number {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000))
}
