"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { BarChart3, TrendingUp, Target, DollarSign, Lightbulb, PieChart, LineChart } from "lucide-react"

export default function AnalyticsPage() {
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

  const analyticsData = [
    {
      title: "Total Ideas Validated",
      value: "24",
      change: "+8 this month",
      icon: Lightbulb,
      color: "from-cyan-500 to-blue-600",
      chart: "📈",
    },
    {
      title: "Average Viability Score",
      value: "8.3",
      change: "+0.7 improvement",
      icon: Target,
      color: "from-green-500 to-teal-600",
      chart: "📊",
    },
    {
      title: "Market Opportunities",
      value: "$403B",
      change: "Total TAM analyzed",
      icon: DollarSign,
      color: "from-purple-500 to-pink-600",
      chart: "💰",
    },
    {
      title: "Success Rate",
      value: "87%",
      change: "Ideas above 7/10",
      icon: TrendingUp,
      color: "from-orange-500 to-red-600",
      chart: "🎯",
    },
  ]

  const industryBreakdown = [
    { industry: "FinTech", count: 8, percentage: 33 },
    { industry: "SaaS", count: 6, percentage: 25 },
    { industry: "HealthTech", count: 4, percentage: 17 },
    { industry: "EdTech", count: 3, percentage: 13 },
    { industry: "Others", count: 3, percentage: 12 },
  ]

  const monthlyValidations = [
    { month: "Jan", validations: 3 },
    { month: "Feb", validations: 5 },
    { month: "Mar", validations: 8 },
    { month: "Apr", validations: 6 },
    { month: "May", validations: 2 },
  ]

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
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Deep insights into your startup validation journey</p>
          </motion.div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {analyticsData.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center`}
                      >
                        <metric.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl">{metric.chart}</div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm font-medium">{metric.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Industry Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                    Industry Breakdown
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribution of validated ideas by industry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {industryBreakdown.map((item, index) => (
                      <div key={item.industry} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                              index === 0
                                ? "from-cyan-500 to-blue-600"
                                : index === 1
                                  ? "from-green-500 to-teal-600"
                                  : index === 2
                                    ? "from-purple-500 to-pink-600"
                                    : index === 3
                                      ? "from-orange-500 to-red-600"
                                      : "from-gray-500 to-gray-600"
                            }`}
                          />
                          <span className="text-gray-300">{item.industry}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{item.count}</span>
                          <span className="text-gray-500 text-sm">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <LineChart className="w-5 h-5 mr-2 text-cyan-400" />
                    Monthly Validations
                  </CardTitle>
                  <CardDescription className="text-gray-400">Number of ideas validated per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyValidations.map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <span className="text-gray-300">{month.month} 2024</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                              style={{ width: `${(month.validations / 8) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold w-6">{month.validations}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                  Performance Insights
                </CardTitle>
                <CardDescription className="text-gray-400">Key insights from your validation data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">🚀</div>
                    <h3 className="text-white font-semibold mb-1">Top Performer</h3>
                    <p className="text-gray-400 text-sm">AI-Powered Finance Assistant (9.1/10)</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">📈</div>
                    <h3 className="text-white font-semibold mb-1">Best Growth</h3>
                    <p className="text-gray-400 text-sm">EdTech sector showing 22% CAGR</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">💡</div>
                    <h3 className="text-white font-semibold mb-1">Recommendation</h3>
                    <p className="text-gray-400 text-sm">Focus on SaaS and FinTech opportunities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
