import { createServerClient } from "./supabase"

export async function initializeDatabase() {
  const supabase = createServerClient()

  try {
    // Check if tables exist, if not create them
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (error) {
      console.error("Error checking tables:", error)
      return false
    }

    const tableNames = tables?.map((t) => t.table_name) || []

    // Create tables if they don't exist
    if (!tableNames.includes("profiles")) {
      await supabase.rpc("create_profiles_table")
    }

    if (!tableNames.includes("ideas")) {
      await supabase.rpc("create_ideas_table")
    }

    if (!tableNames.includes("validation_reports")) {
      await supabase.rpc("create_validation_reports_table")
    }

    if (!tableNames.includes("waitlist")) {
      await supabase.rpc("create_waitlist_table")
    }

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Database initialization error:", error)
    return false
  }
}
