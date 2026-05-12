import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Vercel Cron: founder pulse email when RESEND_* is configured.
 * Protect with Authorization: Bearer CRON_SECRET (must match env).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")?.trim()
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null

  if (!secret || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const to = process.env.WEEKLY_DIGEST_TO_EMAIL

  if (!resendKey || !to) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "RESEND_API_KEY or WEEKLY_DIGEST_TO_EMAIL not set",
    })
  }

  const admin = getSupabaseAdmin()
  let runCount: number | null = null
  let verdictMix = "—"
  if (admin) {
    const { count } = await admin.from("validation_runs").select("*", { count: "exact", head: true })
    runCount = typeof count === "number" ? count : null

    const { data: rows } = await admin
      .from("validation_runs")
      .select("verdict")
      .not("verdict", "is", null)
      .limit(5000)

    if (rows?.length) {
      const b = rows.filter((r) => r.verdict === "BUILD").length
      const p = rows.filter((r) => r.verdict === "PIVOT").length
      const k = rows.filter((r) => r.verdict === "KILL").length
      verdictMix = `${b} BUILD · ${p} PIVOT · ${k} KILL (sample up to 5000 rows)`
    }
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(resendKey)
    const from = process.env.RESEND_FROM_EMAIL || "VERDIKT <notifications@localhost>"
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || ""

    const lines = [
      "VERDIKT — weekly pulse",
      "",
      runCount != null ? `Total validation runs on record (approx.): ${runCount}` : "Run totals unavailable (Supabase not configured).",
      verdictMix !== "—" ? `Verdict mix (recent sample): ${verdictMix}` : "",
      "",
      "Next: wire per-user cohort sections from founder-memory bundles + blind-spot deltas.",
      base ? `\nOpen app: ${base}` : "",
      `${base ? `${base}/dashboard` : "/dashboard"} — Command center`,
      `${base ? `${base}/explore` : "/explore"} — Public memos`,
    ].filter(Boolean)

    await resend.emails.send({
      from,
      to: [to],
      subject: `VERDIKT pulse · ${new Date().toISOString().slice(0, 10)}`,
      text: lines.join("\n"),
    })

    return NextResponse.json({ ok: true, sent: true, runCount })
  } catch (e) {
    console.error("[cron/weekly-digest]", e)
    return NextResponse.json({ ok: false, error: "Send failed" }, { status: 500 })
  }
}
