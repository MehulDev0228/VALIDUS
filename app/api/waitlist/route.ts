import fs from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { z } from "zod"
import { microcopy } from "@/lib/microcopy"
import { getClientIpFromRequest } from "@/lib/rate-limit"

const BODY = z.object({
  email: z.string().email().max(254),
  inviteCode: z.string().max(64).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

/** In-process burst guard (fine for single-node; augment with Redis in prod if needed) */
const BURST_MS = 60 * 60 * 1000
const MAX_PER_IP_BURST = 8
const hits = new Map<string, number[]>()

function pruneBurst(ip: string): number[] {
  const now = Date.now()
  const arr = hits.get(ip) ?? []
  const next = arr.filter((t) => now - t < BURST_MS)
  hits.set(ip, next)
  return next
}

function passesBurst(ip: string): boolean {
  const next = pruneBurst(ip)
  if (next.length >= MAX_PER_IP_BURST) return false
  next.push(Date.now())
  hits.set(ip, next)
  return true
}

function validInvite(code: string | null | undefined): boolean {
  const raw = process.env.FV_ALPHA_INVITE_CODES
  if (!raw?.trim()) return true
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (allowed.length === 0) return true
  const got = typeof code === "string" ? code.trim() : ""
  return !!got && allowed.includes(got)
}

export async function POST(request: Request) {
  try {
    const ip = getClientIpFromRequest(request as Request & { ip?: string | null })
    if (!passesBurst(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests from this network. Try again in an hour." },
        { status: 429 },
      )
    }

    const json = await request.json().catch(() => null)
    const parsed = BODY.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Valid email required." }, { status: 400 })
    }

    if (!validInvite(parsed.data.inviteCode)) {
      return NextResponse.json({ success: false, error: microcopy.validate.errors.inviteInvalid }, { status: 403 })
    }

    const dir = path.join(process.cwd(), "data", "waitlist")
    await fs.mkdir(dir, { recursive: true })
    const line =
      JSON.stringify({
        at: new Date().toISOString(),
        email: parsed.data.email.toLowerCase(),
        inviteCode: parsed.data.inviteCode?.trim() || undefined,
        note: parsed.data.note?.trim() || undefined,
      }) + "\n"

    await fs.appendFile(path.join(dir, "entries.jsonl"), line, "utf8")
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("POST /api/waitlist", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
