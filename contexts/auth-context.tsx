"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getBrowserSupabase } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
  name?: string
  image?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  /** False when NEXT_PUBLIC_SUPABASE_* env vars are missing. */
  authConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: (callbackUrl?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapSupabaseUser(u: SupabaseUser): User {
  const meta = u.user_metadata as { full_name?: string; avatar_url?: string; picture?: string } | undefined
  return {
    id: u.id,
    email: u.email ?? "",
    user_metadata: { full_name: meta?.full_name },
    name: meta?.full_name ?? u.email?.split("@")[0] ?? "",
    image: meta?.avatar_url ?? meta?.picture,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => getBrowserSupabase(), [])
  const authConfigured = Boolean(supabase)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signInWithGoogle = async (callbackUrl: string = "/dashboard") => {
    if (!supabase) throw new Error("Supabase auth is not configured")
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const safe = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard"
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safe)}`,
      },
    })
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: "Authentication is not configured. Add Supabase URL and anon key." }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: "Authentication is not configured. Add Supabase URL and anon key." }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) return { error: error.message }
    return {}
  }

  const signOut = async () => {
    if (!supabase) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authConfigured,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
