"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Users, Copy, UserPlus, Share2, CheckCircle, AlertCircle } from "lucide-react"

export default function CollaborationsPage() {
  const [teamCode, setTeamCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Generate team code for current user
    if (user) {
      const code = `TEAM-${user.id.slice(-6).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      setTeamCode(code)

      // Load existing team members from localStorage
      const savedMembers = localStorage.getItem(`team_${user.id}`)
      if (savedMembers) {
        setTeamMembers(JSON.parse(savedMembers))
      }
    }
  }, [user])

  const copyTeamCode = async () => {
    try {
      await navigator.clipboard.writeText(teamCode)
      setMessage("Team code copied to clipboard!")
      setMessageType("success")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Failed to copy code")
      setMessageType("error")
    }
  }

  const joinTeam = () => {
    if (!joinCode.trim()) {
      setMessage("Please enter a team code")
      setMessageType("error")
      return
    }

    // Simulate joining a team
    const newMember = `User-${joinCode.slice(-4)}`
    const updatedMembers = [...teamMembers, newMember]
    setTeamMembers(updatedMembers)

    // Save to localStorage
    if (user) {
      localStorage.setItem(`team_${user.id}`, JSON.stringify(updatedMembers))
    }

    setMessage(`Successfully joined team with code: ${joinCode}`)
    setMessageType("success")
    setJoinCode("")
    setTimeout(() => setMessage(""), 3000)
  }

  const removeTeamMember = (memberToRemove: string) => {
    const updatedMembers = teamMembers.filter((member) => member !== memberToRemove)
    setTeamMembers(updatedMembers)

    if (user) {
      localStorage.setItem(`team_${user.id}`, JSON.stringify(updatedMembers))
    }
  }

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Team Collaborations</h1>
            <p className="text-gray-400">Share your team code with others to collaborate on startup ideas</p>
          </motion.div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-3 rounded-lg border flex items-center space-x-2 ${
                messageType === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {messageType === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm">{message}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Team Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Share2 className="w-5 h-5 mr-2 text-cyan-400" />
                    Your Team Code
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Share this code with team members to invite them
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <code className="text-cyan-400 font-mono text-lg">{teamCode}</code>
                    </div>
                    <Button
                      onClick={copyTeamCode}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Team members can use this code to join your collaboration workspace
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Join Team */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-green-400" />
                    Join a Team
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter a team code to join an existing collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-code" className="text-gray-300">
                      Team Code
                    </Label>
                    <Input
                      id="join-code"
                      placeholder="TEAM-ABC123-XYZ4"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-cyan-500"
                    />
                  </div>
                  <Button
                    onClick={joinTeam}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                  >
                    Join Team
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Team Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-400" />
                  Team Members ({teamMembers.length + 1})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Current members in your collaboration workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Current User */}
                  <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.user_metadata?.full_name || user.email?.split("@")[0]} (You)
                        </p>
                        <p className="text-cyan-400 text-sm">Team Owner</p>
                      </div>
                    </div>
                    <div className="text-cyan-400 text-sm">Owner</div>
                  </div>

                  {/* Team Members */}
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{member.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{member}</p>
                          <p className="text-gray-400 text-sm">Team Member</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeTeamMember(member)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  {teamMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No team members yet</p>
                      <p className="text-sm">Share your team code to invite collaborators</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Collaboration Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <CardContent className="p-6 text-center">
                <Share2 className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Share Ideas</h3>
                <p className="text-gray-400 text-sm">Collaborate on startup ideas with your team members</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Team Feedback</h3>
                <p className="text-gray-400 text-sm">Get feedback and insights from your collaborators</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Joint Validation</h3>
                <p className="text-gray-400 text-sm">Validate ideas together and make informed decisions</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
