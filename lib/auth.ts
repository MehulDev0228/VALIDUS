import { createClient } from "@/lib/supabase/server"

export type AuthSession = {
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

/**
 * Server-side session via Supabase cookies (see middleware refresh).
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null

    const meta = user.user_metadata as { full_name?: string; avatar_url?: string; picture?: string } | undefined
    return {
      user: {
        id: user.id,
        email: user.email,
        name: meta?.full_name ?? user.email?.split("@")[0] ?? null,
        image: meta?.avatar_url ?? meta?.picture ?? null,
      },
    }
  } catch {
    return null
  }
}
