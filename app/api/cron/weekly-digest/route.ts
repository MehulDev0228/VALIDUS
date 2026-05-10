import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { sendWeeklyDigestStatsEmail } from "@/lib/services/email"

export const runtime = "nodejs"

/**
 * Schedule via Vercel Cron (`vercel.json`) or call manually with:
 *   Authorization: Bearer $CRON_SECRET
 *   or ?secret=$CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  const qs = new URL(request.url).searchParams.get("secret")
  const authorized =
    (secret && auth === `Bearer ${secret}`) ||
    (secret && qs === secret) ||
    (process.env.NODE_ENV !== "production" && !secret)

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  let memoCount = 0
  if (admin) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count, error } = await admin
      .from("validation_runs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
    if (error) console.error("[weekly-digest] count", error)
    memoCount = count ?? 0
  }

  const to = process.env.WEEKLY_DIGEST_TO_EMAIL
  let emailed = false
  if (to) {
    const r = await sendWeeklyDigestStatsEmail(to, memoCount)
    emailed = r.ok
  }

  return NextResponse.json({
    ok: true,
    memosLast7Days: memoCount,
    digestEmailConfigured: Boolean(to),
    emailed,
  })
}
