"use client"

import { motion } from "framer-motion"
import { FileText, Brain, BarChart3, Rocket } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      icon: FileText,
      title: "Submit Your Idea",
      description: "Fill out our smart form with your startup concept, target market, and key features.",
      color: "from-cyan-400 to-blue-500",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Our multi-agent AI system analyzes market data, competitors, and validates your concept.",
      color: "from-blue-500 to-purple-500",
    },
    {
      icon: BarChart3,
      title: "Get Insights",
      description: "Receive comprehensive reports with TAM/SAM/SOM, SWOT analysis, and market projections.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Rocket,
      title: "Launch Confidently",
      description: "Use our recommendations and business plan to make informed decisions about your startup.",
      color: "from-pink-500 to-red-500",
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-24 bg-gradient-to-b from-black via-gray-900/50 to-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From idea to validation in just 4 simple steps. Our AI does the heavy lifting while you focus on building.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 transform -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative group"
              >
                {/* Step Number */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                    >
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-black border-2 border-cyan-400 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    {/* Glow Effect */}
                    <div
                      className={`absolute inset-0 w-20 h-20 bg-gradient-to-r ${step.color} rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-8 text-cyan-500/50">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M6 16H26M26 16L20 10M26 16L20 22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            { number: "2min", label: "Average Processing Time" },
            { number: "95%", label: "Accuracy Rate" },
            { number: "50+", label: "Data Sources" },
            { number: "24/7", label: "AI Availability" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
