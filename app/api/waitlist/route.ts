import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo (replace with database in production)
const waitlistEntries: Array<{ email: string; source: string; created_at: string }> = []

export async function POST(request: NextRequest) {
  try {
    const { email, source = "homepage" } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if email already exists
    const existingEntry = waitlistEntries.find((entry) => entry.email === email)
    if (existingEntry) {
      return NextResponse.json({ message: "You're already on our waitlist!" })
    }

    // Add to waitlist
    waitlistEntries.push({
      email,
      source,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ message: "Successfully joined the waitlist!" })
  } catch (error) {
    console.error("Waitlist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    total_entries: waitlistEntries.length,
    entries: waitlistEntries.map((entry) => ({
      email: entry.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email for privacy
      source: entry.source,
      created_at: entry.created_at,
    })),
  })
}
