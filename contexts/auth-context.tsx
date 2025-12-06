"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

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
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const loading = status === "loading"

  useEffect(() => {
    if (session?.user) {
      // Convert NextAuth user to our User format
      setUser({
        id: session.user.id || `google_${Date.now()}`,
        email: session.user.email || '',
        name: session.user.name || '',
        image: session.user.image || '',
        user_metadata: {
          full_name: session.user.name || ''
        }
      })
    } else if (!loading) {
      // Check for local auth (fallback) only when not loading
      const savedUser = localStorage.getItem("futurevalidate_user")
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error("Error parsing saved user:", error)
          localStorage.removeItem("futurevalidate_user")
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }
  }, [session, loading])

  const signInWithGoogle = async () => {
    try {
      await nextAuthSignIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Google sign in error:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Fallback local auth for demo
      if (email && password.length >= 6) {
        const newUser: User = {
          id: `user_${Date.now()}`,
          email,
          user_metadata: {
            full_name: email.split("@")[0],
          },
        }
        setUser(newUser)
        localStorage.setItem("futurevalidate_user", JSON.stringify(newUser))
        return { error: undefined }
      } else {
        return { error: "Invalid email or password (minimum 6 characters)" }
      }
    } catch (error) {
      return { error: "Sign in failed" }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Fallback local auth for demo
      if (email && password.length >= 6 && fullName) {
        const newUser: User = {
          id: `user_${Date.now()}`,
          email,
          user_metadata: {
            full_name: fullName,
          },
        }
        setUser(newUser)
        localStorage.setItem("futurevalidate_user", JSON.stringify(newUser))
        return { error: undefined }
      } else {
        return { error: "Please fill all fields (password minimum 6 characters)" }
      }
    } catch (error) {
      return { error: "Sign up failed" }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from NextAuth if session exists
      if (session) {
        await nextAuthSignOut({ redirect: false })
      }
      // Clear local storage
      setUser(null)
      localStorage.removeItem("futurevalidate_user")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>
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