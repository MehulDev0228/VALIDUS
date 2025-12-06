"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { TrendingUp, DollarSign, Users, Target, Plus, BarChart3, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

// TODO: Once persistence is added, fetch real idea summaries and stats for this user.

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      <main className="md:ml-64 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user.user_metadata?.full_name || user.email?.split("@")[0] || "there"}!
            </h1>
            <p className="text-gray-400">Here's an overview of your startup validation journey.</p>
          </motion.div>
        </div>

        {/* Empty state for now; later this can show real stats once persistence is wired. */}

        {/* Recent Ideas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Ideas</CardTitle>
                <CardDescription className="text-gray-400">
                  Once you start validating, your recent ideas will show up here.
                </CardDescription>
              </div>
              <Link href="/dashboard/validate">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  New Validation
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="py-8 text-center text-gray-500 text-sm">
                No validations yet. Run your first idea to see rich reports here.
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link href="/dashboard/validate">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Validate New Idea</h3>
                <p className="text-gray-400 text-sm">Submit your next startup concept for AI analysis</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Invite Collaborators</h3>
              <p className="text-gray-400 text-sm">Share ideas with your team for feedback</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20 hover:border-green-500/40 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">View Analytics</h3>
              <p className="text-gray-400 text-sm">Deep dive into your validation metrics</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
