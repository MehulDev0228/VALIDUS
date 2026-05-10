import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { getAuthSession } from "@/lib/auth"
import { formatRunId } from "@/lib/validation/extract-run-meta"

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ success: false, error: "Sign-in required." }, { status: 401 })
  }

  const raw = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 200)
  if (raw.length < 2) {
    return NextResponse.json({ success: true, runs: [] })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 })
  }

  const { data, error } = await admin
    .from("validation_runs")
    .select("id, idea_title, verdict, opportunity_score, created_at")
    .eq("user_id", uid)
    .ilike("idea_title", `%${raw}%`)
    .order("created_at", { ascending: false })
    .limit(40)

  if (error) {
    console.error("[archive/search]", error)
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    runs: (data ?? []).map((r: { id: string; idea_title: string; verdict: string | null; opportunity_score: number | null; created_at: string }) => ({
      runId: formatRunId(r.id),
      ideaTitle: r.idea_title,
      verdict: r.verdict,
      opportunityScore: r.opportunity_score,
      createdAt: r.created_at,
    })),
  })
}
