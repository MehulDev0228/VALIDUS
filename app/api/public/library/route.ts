import { NextResponse } from "next/server"
import { listPublicLibraryRuns } from "@/lib/validation-run-store"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit")) || 24))

  const items = await listPublicLibraryRuns(limit)
  return NextResponse.json({ success: true, items })
}
