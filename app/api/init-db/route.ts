import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Test if we can connect to Supabase
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Database connection successful" })
  } catch (error) {
    console.error("Database init error:", error)
    return NextResponse.json({ error: "Database initialization failed" }, { status: 500 })
  }
}
