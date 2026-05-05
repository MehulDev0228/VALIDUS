import { type NextRequest, NextResponse } from "next/server"
import {
  buildRateLimitKey,
  FREE_DAILY_LIMIT,
  getClientIpFromRequest,
  readFreeUsage,
  secondsUntilUtcMidnight,
} from "@/lib/rate-limit"

/**
 * GET /api/usage?user_id=...&fingerprint=...
 *
 * Returns the caller's current daily usage state so the dashboard can render
 * the meter without firing a write. Anonymous reads fall back to IP+fingerprint.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("user_id")?.slice(0, 128) || null
  const fingerprint = url.searchParams.get("fingerprint")?.slice(0, 128) || null

  const ip = getClientIpFromRequest(request as any)
  const key = buildRateLimitKey({ userId, ip, fingerprint })
  const used = await readFreeUsage(key)
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used)
  const resetIn = secondsUntilUtcMidnight()

  return NextResponse.json(
    {
      success: true,
      used: Math.min(used, FREE_DAILY_LIMIT),
      limit: FREE_DAILY_LIMIT,
      remaining,
      resetInSeconds: resetIn,
      authenticated: Boolean(userId),
    },
    { status: 200 },
  )
}
