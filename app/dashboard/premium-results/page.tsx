"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default function PremiumResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [validationResults, setValidationResults] = useState<any>(null)

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("premiumValidationResults") : null

    if (stored) {
      setValidationResults(JSON.parse(stored))
    }

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <main className="md:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Loading Premium Report...</h2>
            <p className="text-gray-400">Fetching your full investor-ready analysis</p>
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
            <h2 className="text-xl font-semibold text-white mb-2">No Premium Report Found</h2>
            <p className="text-gray-400 mb-4">Run a premium validation first.</p>
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
                <h1 className="text-3xl font-bold text-white mb-2">Premium Validation Report</h1>
                <p className="text-gray-400 text-sm">Investor-ready, multi-agent analysis</p>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                  <Download className="w-4 h-4 mr-2" />
                  Export One-Pager
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
                  {validationResults.business_plan}
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
                      {validationResults.swot_analysis.strengths.map((strength: string, index: number) => (
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
                      {validationResults.swot_analysis.weaknesses.map((weakness: string, index: number) => (
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
                      {validationResults.swot_analysis.opportunities.map((opportunity: string, index: number) => (
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
                      {validationResults.swot_analysis.threats.map((threat: string, index: number) => (
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

          {/* Business Plan & Benchmarking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          >
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

            {/* Executive Summary */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Executive Narrative</CardTitle>
                <CardDescription className="text-gray-400">
                  High-level story suitable for a one-pager or intro email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {validationResults.business_plan}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
