const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MAX_FREE_PER_DAY = 2

type Timestamp = number

const freeUsageByKey = new Map<string, Timestamp[]>()

function pruneOld(now: number, timestamps: Timestamp[]): Timestamp[] {
  return timestamps.filter((ts) => now - ts < ONE_DAY_MS)
}

function canConsumeInMemory(key: string): boolean {
  const now = Date.now()
  const existing = freeUsageByKey.get(key) ?? []
  const recent = pruneOld(now, existing)

  return recent.length < MAX_FREE_PER_DAY
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

export async function canConsumeFreeValidation(key: string): Promise<boolean> {
  const redis = await getUpstashRedis()
  if (!redis) return canConsumeInMemory(key)
  const dailyKey = buildDailyKey(key)
  const count = await redis.get<number>(dailyKey)
  return (count ?? 0) < MAX_FREE_PER_DAY
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

export function buildRateLimitKey(ip: string, fingerprint: string | null): string {
  return `${ip}::${fingerprint || "no-fingerprint"}`
}
