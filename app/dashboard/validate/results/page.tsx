"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { runPremiumValidationClient, getStoredOpenAIApiKey, storeOpenAIApiKey } from "@/lib/agents/client-byo"
import { AlertTriangle, ArrowLeft, Share, Download, DollarSign, TrendingUp, Target, Users, BarChart3, CheckCircle, Lightbulb } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ValidationResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [validationResults, setValidationResults] = useState<any>(null)
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [premiumError, setPremiumError] = useState<string | null>(null)
  const [premiumSummary, setPremiumSummary] = useState<string | null>(null)
  const [clientApiKey, setClientApiKey] = useState<string>("")
  const [serverPremiumLoading, setServerPremiumLoading] = useState(false)
  const [serverPremiumError, setServerPremiumError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Prefer real validation results from the validate flow
    const stored = typeof window !== "undefined" ? localStorage.getItem("validationResults") : null

    if (stored) {
      setValidationResults(JSON.parse(stored))
    }

    // Load any stored client-side OpenAI key for BYO premium runs
    const storedKey = getStoredOpenAIApiKey()
    if (storedKey) setClientApiKey(storedKey)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <main className="md:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Analyzing Your Idea...</h2>
            <p className="text-gray-400">Our AI agents are working hard to validate your concept</p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <p>🤖 Agent 1: Structuring your idea...</p>
              <p>🔍 Agent 2: Researching market data...</p>
              <p>⚔️ Agent 3: Analyzing competitors...</p>
              <p>📊 Agent 4: Creating business plan...</p>
              <p>🎯 Agent 5: Final assessment...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!validationResults) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <main className="md:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No Results Found</h2>
            <p className="text-gray-400 mb-4">Please validate an idea first.</p>
            <Link href="/dashboard/validate">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                Validate New Idea
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const isPremiumShape = Boolean((validationResults as any).tam_data)

  // Free-only layout when we have a lightweight FreeValidationResponse from /api/validate-idea
  if (!isPremiumShape) {
    const free = validationResults as any
    const score: number = free.score ?? 0
    const classification: string = free.classification ?? "possible"

    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <main className="md:ml-64 p-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Free Validation Result</h1>
                <p className="text-gray-400 text-sm">
                  This is a fast, heuristic read on your idea. For deeper analysis, you can run a premium evaluation.
                </p>
              </div>
            </motion.div>

            {/* Score & classification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Viability Score</p>
                    <p className="text-3xl font-bold text-white">{score}/10</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">Classification: {classification}</p>
                  </div>
                  <div className="text-right max-w-xs text-sm text-gray-300">
                    <p>{free.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* TAM / SAM / SOM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mb-6"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Heuristic Market Estimates</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Quick TAM / SAM / SOM ranges inferred from your industry and inputs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-200">
                  <div>
                    <p className="font-semibold text-cyan-300">TAM</p>
                    <p>{free.tamSamSom?.TAM ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-300">SAM</p>
                    <p>{free.tamSamSom?.SAM ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-300">SOM</p>
                    <p>{free.tamSamSom?.SOM ?? "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Risks & pivots */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Top Risks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-200">
                  {(free.topRisks ?? []).slice(0, 3).map((risk: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 mt-1" />
                      <span>{risk}</span>
                    </div>
                  ))}
                  {(!free.topRisks || free.topRisks.length === 0) && (
                    <p className="text-gray-500 text-xs">No explicit risks identified.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Pivot Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-200">
                  {(free.pivots ?? []).slice(0, 3).map((p: any, idx: number) => (
                    <div key={idx}>
                      <p className="font-semibold text-cyan-300 text-xs mb-1">{p.title}</p>
                      <p className="text-gray-300 text-xs">{p.why}</p>
                    </div>
                  ))}
                  {(!free.pivots || free.pivots.length === 0) && (
                    <p className="text-gray-500 text-xs">No pivot suggestions generated.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Comparables */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-10"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Closest Comparables</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Startups or patterns that look similar to your idea.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-200">
                  {(free.comparables ?? []).length > 0 ? (
                    free.comparables.map((c: any, idx: number) => (
                      <div key={idx} className="border border-white/10 rounded-md px-3 py-2 bg-black/20">
                        <p className="font-semibold text-gray-100 text-xs">{c.name}</p>
                        <p className="text-gray-300 text-xs mb-1">{c.reason}</p>
                        {c.url && (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-cyan-300 underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs">
                      No comparables were surfaced. Try adding more detail about your market or target customer.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "from-green-500 to-green-400"
    if (score >= 6) return "from-yellow-500 to-yellow-400"
    return "from-red-500 to-red-400"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent"
    if (score >= 6) return "Good"
    if (score >= 4) return "Fair"
    return "Poor"
  }

  const handleRunPremiumClient = async () => {
    setPremiumError(null)
    setPremiumSummary(null)

    if (!clientApiKey) {
      setPremiumError("Please paste your OpenAI API key to run a deep premium validation in the browser.")
      return
    }

    let ideaPayload: any = null
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("lastIdeaInput") : null
      if (!stored) {
        setPremiumError("Original idea input not found. Please re-run a free validation first.")
        return
      }
      ideaPayload = JSON.parse(stored)
    } catch {
      setPremiumError("Could not read last idea input from local storage.")
      return
    }

    try {
      setPremiumLoading(true)
      storeOpenAIApiKey(clientApiKey)

      const full = await runPremiumValidationClient(ideaPayload, { apiKey: clientApiKey })
      // Persist the full premium result and navigate to the dedicated premium report page
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("premiumValidationResults", JSON.stringify(full))
        } catch {
          // ignore
        }
      }
      setPremiumSummary(full.summary)
      router.push("/dashboard/premium-results")
    } catch (err: any) {
      setPremiumError(err?.message || "Premium validation failed. Check your API key and try again.")
    } finally {
      setPremiumLoading(false)
    }
  }

  const handleRunPremiumServer = async () => {
    setServerPremiumError(null)

    let ideaPayload: any = null
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("lastIdeaInput") : null
      if (!stored) {
        setServerPremiumError("Original idea input not found. Please re-run a free validation first.")
        return
      }
      ideaPayload = JSON.parse(stored)
    } catch {
      setServerPremiumError("Could not read last idea input from local storage.")
      return
    }

    try {
      setServerPremiumLoading(true)
      const res = await fetch("/api/premium/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_data: ideaPayload, mode: "oneoff" }),
      })

      if (res.status === 401) {
        setServerPremiumError("Sign in required. Please log in and try again.")
        return
      }

      if (res.status === 402) {
        const data = await res.json().catch(() => null)
        setServerPremiumError(data?.error || "No premium credits available. Purchase one and try again.")
        return
      }

      if (!res.ok) {
        setServerPremiumError("Server premium validation failed. Please try again later.")
        return
      }

      const data = await res.json()
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("premiumValidationResults", JSON.stringify(data.validation_results))
        } catch {
          // ignore
        }
      }
      router.push("/dashboard/premium-results")
    } catch (err: any) {
      setServerPremiumError(err?.message || "Server premium validation failed.")
    } finally {
      setServerPremiumLoading(false)
    }
  }

  const handleBuyPremiumCredit = async () => {
    setCheckoutError(null)

    try {
      setCheckoutLoading(true)
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "oneoff" }),
      })

      if (res.status === 401) {
        setCheckoutError("Sign in required. Please log in and try again.")
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setCheckoutError(data?.error || "Unable to start Stripe checkout. Please try again.")
        return
      }

      const data = await res.json()
      if (data?.url) {
        if (typeof window !== "undefined") {
          window.location.href = data.url as string
        }
      } else {
        setCheckoutError("Stripe checkout URL missing from response.")
      }
    } catch (err: any) {
      setCheckoutError(err?.message || "Failed to start Stripe checkout.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      <main className="md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Validation Results</h1>
                <p className="text-gray-400">{validationResults.idea_title}</p>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Viability Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${validationResults.viability_score * 31.4} 314`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{validationResults.viability_score}</div>
                        <div className="text-sm text-gray-400">/ 10</div>
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {getScoreLabel(validationResults.viability_score)} Viability
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Your idea shows strong potential with solid market fundamentals and clear differentiation
                  opportunities.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Market Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                    TAM Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      ${(validationResults.tam_data.total_market / 1000000000).toFixed(0)}B
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Total Addressable Market</p>
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">
                        {validationResults.tam_data.growth_rate}% CAGR
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-400" />
                    SAM Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      ${(validationResults.sam_data.serviceable_market / 1000000000).toFixed(0)}B
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Serviceable Addressable Market</p>
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-semibold">
                        {validationResults.sam_data.penetration_rate}% Penetration
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                    SOM Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      ${(validationResults.som_data.obtainable_market / 1000000000).toFixed(1)}B
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Serviceable Obtainable Market</p>
                    <div className="flex items-center justify-center space-x-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-semibold">
                        {validationResults.som_data.realistic_capture}% Realistic Capture
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* SWOT Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">SWOT Analysis</CardTitle>
                <CardDescription className="text-gray-400">
                  Comprehensive analysis of your idea's strategic position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-400 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Strengths
                    </h3>
                    <div className="space-y-2">
                      {validationResults.swot_analysis.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-gray-300 text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-400 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Weaknesses
                    </h3>
                    <div className="space-y-2">
                      {validationResults.swot_analysis.weaknesses.map((weakness, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full" />
                          <span className="text-gray-300 text-sm">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-400 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Opportunities
                    </h3>
                    <div className="space-y-2">
                      {validationResults.swot_analysis.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span className="text-gray-300 text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Threats
                    </h3>
                    <div className="space-y-2">
                      {validationResults.swot_analysis.threats.map((threat, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                          <span className="text-gray-300 text-sm">{threat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Founder Readiness & Investor Appeal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Founder Scorecard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white">Founder Readiness</CardTitle>
                  <CardDescription className="text-gray-400">
                    0–100 readiness score across key founder dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">Overall Score</p>
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold text-cyan-400">
                        {validationResults.founder_scorecard?.overall_score ?? 70}
                      </div>
                      <span className="text-xs text-gray-500">/ 100</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Founder–Market Fit</span>
                      <span>{validationResults.founder_scorecard?.founder_market_fit ?? 65}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ambition</span>
                      <span>{validationResults.founder_scorecard?.ambition ?? 80}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Execution Risk</span>
                      <span>{validationResults.founder_scorecard?.execution_risk ?? 60}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clarity of Idea</span>
                      <span>{validationResults.founder_scorecard?.clarity_of_idea ?? 75}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Competitive Moat</span>
                      <span>{validationResults.founder_scorecard?.competitive_moat ?? 55}</span>
                    </div>
                  </div>
                  {validationResults.founder_scorecard?.notes && (
                    <p className="mt-3 text-xs text-gray-400">
                      {validationResults.founder_scorecard.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Investor Appeal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white">Investor Appeal</CardTitle>
                  <CardDescription className="text-gray-400">
                    How attractive this looks to early-stage investors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Overall</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-emerald-400">
                          {validationResults.investor_appeal?.overall_score ?? 70}
                        </span>
                        <span className="text-xs text-gray-500">/ 100</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Market Timing</span>
                      <span>{validationResults.investor_appeal?.market_timing ?? 75}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TAM Realism</span>
                      <span>{validationResults.investor_appeal?.tam_realism ?? 70}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monetization</span>
                      <span>{validationResults.investor_appeal?.monetization_strength ?? 60}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defensibility</span>
                      <span>{validationResults.investor_appeal?.defensibility ?? 55}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distribution</span>
                      <span>{validationResults.investor_appeal?.distribution ?? 50}</span>
                    </div>
                  </div>
                  {validationResults.investor_appeal?.notes && (
                    <p className="mt-3 text-xs text-gray-400">
                      {validationResults.investor_appeal.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Execution Roadmap 30/60/90 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white">30 / 60 / 90 Day Plan</CardTitle>
                  <CardDescription className="text-gray-400">
                    Concrete execution roadmap for the next 3 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-[11px] text-gray-300">
                    <div>
                      <p className="font-semibold text-cyan-300 mb-1">30 Days</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {(validationResults.execution_roadmap?.days_30 ?? []).map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-300 mb-1">60 Days</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {(validationResults.execution_roadmap?.days_60 ?? []).map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-300 mb-1">90 Days</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {(validationResults.execution_roadmap?.days_90 ?? []).map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Business Plan & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white">Business Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-4">{validationResults.business_model}</p>
                  <div className="space-y-2">
                    <h4 className="text-cyan-400 font-semibold">Unique Selling Proposition:</h4>
                    <p className="text-gray-300 text-sm">{validationResults.usp}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="text-white">Key Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-red-400 font-semibold mb-2">Risks to Consider:</h4>
                      <div className="space-y-1">
                        {validationResults.risks_recommendations.risks.slice(0, 2).map((risk, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span className="text-gray-300 text-sm">{risk}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 space-y-2">
                        <h4 className="text-cyan-400 font-semibold">Run Deep Premium Validation (BYO OpenAI Key)</h4>
                        <p className="text-gray-400 text-xs">
                          Paste your own OpenAI API key to run a full multi-agent style premium evaluation directly in
                          your browser. Your key is stored only in this browser (localStorage) and never sent to our
                          servers.
                        </p>
                        <div className="flex flex-col space-y-2 mt-2">
                          <input
                            type="password"
                            value={clientApiKey}
                            onChange={(e) => setClientApiKey(e.target.value)}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            placeholder="sk-..."
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 text-xs"
                              disabled={premiumLoading}
                              onClick={handleRunPremiumClient}
                            >
                              {premiumLoading ? "Running..." : "Run Deep Premium in Browser"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                              disabled={serverPremiumLoading}
                              onClick={handleRunPremiumServer}
                            >
                              {serverPremiumLoading ? "Running on Server..." : "Run Premium on Server (Paid)"}
                            </Button>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <button
                              type="button"
                              onClick={handleBuyPremiumCredit}
                              disabled={checkoutLoading}
                              className="self-start text-[11px] text-cyan-300 hover:text-cyan-200 underline disabled:opacity-60"
                            >
                              {checkoutLoading ? "Opening Stripe checkout..." : "Need credits? Buy a premium validation"}
                            </button>
                          </div>
                          {premiumSummary && !premiumLoading && (
                            <span className="text-[11px] text-green-400">Premium summary updated below.</span>
                          )}
                          {premiumError && (
                            <p className="text-[11px] text-red-400 mt-1">{premiumError}</p>
                          )}
                          {serverPremiumError && (
                            <p className="text-[11px] text-red-400 mt-1">{serverPremiumError}</p>
                          )}
                          {checkoutError && (
                            <p className="text-[11px] text-red-400 mt-1">{checkoutError}</p>
                          )}
                          {premiumSummary && (
                            <p className="text-[11px] text-gray-300 mt-2">
                              <span className="font-semibold text-cyan-300">Premium summary: </span>
                              {premiumSummary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-semibold mb-2">Action Items:</h4>
                      <div className="space-y-1">
                        {validationResults.risks_recommendations.recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-gray-300 text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Red Flags & Pivot Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Benchmarking */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white">Startup Benchmarking</CardTitle>
                  <CardDescription className="text-gray-400">
                    How your idea compares to YC, unicorns, and failed patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-300 mb-3">
                    {validationResults.benchmarking?.overall_positioning ??
                      "Positioned between productivity SaaS and AI decision support."}
                  </p>
                  <div className="space-y-3 text-[11px] text-gray-300">
                    <div>
                      <p className="font-semibold text-cyan-300 mb-1">YC-like Companies</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {(validationResults.benchmarking?.yc_comparables ?? []).map((item: any) => (
                          <li key={item.name}>
                            <span className="font-medium text-gray-100">{item.name}</span> – {item.similarity_reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-300 mb-1">Unicorn Patterns</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {(validationResults.benchmarking?.unicorn_comparables ?? []).map((item: any) => (
                          <li key={item.name}>
                            <span className="font-medium text-gray-100">{item.name}</span> – {item.similarity_reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-red-300 mb-1">Failed Patterns</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {(validationResults.benchmarking?.failed_comparables ?? []).map((item: any) => (
                          <li key={item.name}>
                            <span className="font-medium text-gray-100">{item.name}</span> – {item.similarity_reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Executive Summary / One-pager core */}
              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Executive Summary</CardTitle>
                  <CardDescription className="text-gray-400">
                    High-level narrative you can drop into a one-pager
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {validationResults.business_plan}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
