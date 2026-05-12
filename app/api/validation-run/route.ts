import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import {
  loadValidationRun,
  normalizeRunId,
  saveValidationRun,
  updateRunVisibility,
} from "@/lib/validation-run-store"

const PostBodySchema = z.object({
  idea_id: z.string().min(1).max(256),
  validation_results: z.unknown(),
})

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ success: false, error: "Sign-in required.", code: "AUTH_REQUIRED" }, { status: 401 })
  }

  const rawId = request.nextUrl.searchParams.get("id")
  const runId = rawId ? normalizeRunId(rawId) : null
  if (!runId) {
    return NextResponse.json({ success: false, error: "Invalid run id" }, { status: 400 })
  }

  const rec = await loadValidationRun(uid, runId)
  if (!rec) {
    return NextResponse.json({ success: false, error: "Not found", code: "NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    runId,
    idea_id: rec.ideaId,
    validation_results: rec.validation_results,
    createdAt: rec.createdAt,
    isPublic: rec.isPublic,
    listedInLibrary: rec.listedInLibrary,
  })
}

const PatchBodySchema = z.object({
  id: z.string().min(8).max(128),
  is_public: z.boolean().optional(),
  listed_in_library: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ success: false, error: "Sign-in required.", code: "AUTH_REQUIRED" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = PatchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
  }

  const { id, is_public, listed_in_library } = parsed.data
  if (is_public === undefined && listed_in_library === undefined) {
    return NextResponse.json({ success: false, error: "Provide is_public and/or listed_in_library" }, { status: 400 })
  }

  const res = await updateRunVisibility(uid, id, { isPublic: is_public, listedInLibrary: listed_in_library })
  if (!res.ok) {
    return NextResponse.json({ success: false, error: res.error ?? "Update failed" }, { status: res.error === "Not found" ? 404 : 400 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ success: false, error: "Sign-in required.", code: "AUTH_REQUIRED" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const runId = await saveValidationRun(uid, parsed.data.idea_id, parsed.data.validation_results)
    return NextResponse.json({ success: true, runId, idea_id: parsed.data.idea_id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not persist run"
    const status = msg.includes("too large") ? 413 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
