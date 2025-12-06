// AI Agents for startup validation
export interface IdeaData {
  title: string
  description: string
  industry: string
  target_market: string
  revenue_model: string
  key_features: string
  problem_solving: string
  competitive_advantage: string
  market_size_estimate: string
  timeline: string
}

export interface FounderScorecard {
  overall_score: number // 0-100
  founder_market_fit: number
  ambition: number
  execution_risk: number
  clarity_of_idea: number
  competitive_moat: number
  notes: string
}

export interface RedFlag {
  id: string
  label: string
  severity: "low" | "medium" | "high"
  explanation: string
  suggested_fix?: string
}

export interface PivotSuggestion {
  title: string
  summary: string
  rationale: string
  impact: string
}

export interface BenchmarkItem {
  name: string
  type: "yc" | "unicorn" | "failed"
  similarity_reason: string
  similarity_score: number // 0-100
}

export interface Benchmarking {
  overall_positioning: string
  yc_comparables: BenchmarkItem[]
  unicorn_comparables: BenchmarkItem[]
  failed_comparables: BenchmarkItem[]
}

export interface InvestorAppealScore {
  overall_score: number // 0-100
  market_timing: number
  tam_realism: number
  monetization_strength: number
  defensibility: number
  distribution: number
  notes: string
}

export interface ExecutionRoadmap {
  days_30: string[]
  days_60: string[]
  days_90: string[]
  key_metrics: string[]
  data_to_collect: string[]
}

export interface ValidationResult {
  viability_score: number
  tam_data: {
    total_market: number
    growth_rate: number
    year: number
    currency: string
  }
  sam_data: {
    serviceable_market: number
    penetration_rate: number
    target_segments: string[]
  }
  som_data: {
    obtainable_market: number
    realistic_capture: number
    timeframe: string
  }
  swot_analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  competitor_analysis: {
    direct_competitors: Array<{
      name: string
      market_share: number
      strengths: string[]
    }>
    competitive_advantage: string
  }
  market_trends: Record<string, number>
  usp: string
  business_model: string
  risks_recommendations: {
    risks: string[]
    recommendations: string[]
  }
  business_plan: string
  founder_scorecard: FounderScorecard
  red_flags: RedFlag[]
  pivots: PivotSuggestion[]
  benchmarking: Benchmarking
  investor_appeal: InvestorAppealScore
  execution_roadmap: ExecutionRoadmap
}

// Agent 1: Idea Summarizer and Structurer
export async function agent1_summarizeIdea(ideaData: IdeaData): Promise<any> {
  const prompt = `
  As an expert startup analyst, analyze and structure this startup idea:
  
  Title: ${ideaData.title}
  Description: ${ideaData.description}
  Industry: ${ideaData.industry}
  Target Market: ${ideaData.target_market}
  Revenue Model: ${ideaData.revenue_model}
  Key Features: ${ideaData.key_features}
  Problem Solving: ${ideaData.problem_solving}
  Competitive Advantage: ${ideaData.competitive_advantage}
  
  Provide a structured summary with:
  1. Core problem being solved
  2. Target customer profile
  3. Value proposition
  4. Key differentiators
  5. Market category
  
  Return as JSON format.
  `

  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error("Agent 1 failed to get AI response")
  }

  return await response.json()
}

// Agent 2: Market Data Scraper and Analyzer
export async function agent2_scrapeMarketData(structuredIdea: any, industry: string): Promise<any> {
  const prompt = `
  As a market research expert, analyze the market for this startup idea in the ${industry} industry:
  
  Core Problem: ${structuredIdea.core_problem}
  Target Customer: ${structuredIdea.target_customer}
  Market Category: ${structuredIdea.market_category}
  
  Provide comprehensive market analysis including:
  1. Total Addressable Market (TAM) size and growth rate
  2. Serviceable Addressable Market (SAM) 
  3. Market trends and drivers
  4. Industry growth projections for next 5 years
  5. Key market segments
  
  Use real market data and provide specific numbers. Return as JSON.
  `

  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error("Agent 2 failed to get market data")
  }

  return await response.json()
}

// Agent 3: Competitor Analysis and SWOT
export async function agent3_analyzeCompetitors(structuredIdea: any, marketData: any): Promise<any> {
  const prompt = `
  As a competitive intelligence expert, analyze the competitive landscape for this startup:
  
  Idea: ${structuredIdea.core_problem}
  Market Category: ${structuredIdea.market_category}
  Value Proposition: ${structuredIdea.value_proposition}
  Key Differentiators: ${JSON.stringify(structuredIdea.key_differentiators)}
  Market Size: $${(marketData.tam.total_market / 1000000000).toFixed(1)}B
  
  Provide:
  1. Top 3-5 direct competitors with market share and strengths
  2. Competitive advantage analysis
  3. SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
  4. Market positioning recommendations
  
  Return as JSON with specific competitor names and data.
  `

  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error("Agent 3 failed to get competitor analysis")
  }

  return await response.json()
}

// Agent 4: Business Model and GTM Strategy
export async function agent4_generateBusinessPlan(
  structuredIdea: any,
  marketData: any,
  competitorData: any,
): Promise<any> {
  const prompt = `
  As a business strategy consultant, create a comprehensive business plan for this startup:
  
  Idea: ${structuredIdea.core_problem}
  Market Size: $${(marketData.tam.total_market / 1000000000).toFixed(1)}B TAM
  Growth Rate: ${marketData.tam.growth_rate.toFixed(1)}%
  Competitive Advantage: ${competitorData.competitive_advantage}
  Key Differentiators: ${JSON.stringify(structuredIdea.key_differentiators)}
  
  Provide:
  1. Detailed business model recommendations
  2. Revenue stream analysis
  3. Go-to-market strategy
  4. Unique selling proposition refinement
  5. Monetization approach
  6. Growth strategy
  
  Return as JSON with actionable business recommendations.
  `

  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error("Agent 4 failed to get business plan")
  }

  return await response.json()
}

// Agent 5: Risk Assessment and Final Scoring
export async function agent5_assessRisksAndScore(allData: any): Promise<ValidationResult> {
  const prompt = `
  As a startup investment analyst, provide final validation and scoring for this startup idea:
  
  Structured Idea: ${JSON.stringify(allData.structuredIdea)}
  Market Data: ${JSON.stringify(allData.marketData)}
  Competitor Analysis: ${JSON.stringify(allData.competitorData)}
  Business Plan: ${JSON.stringify(allData.businessPlan)}
  
  Provide:
  1. Overall viability score (0-10) with detailed justification
  2. Key risks and mitigation strategies
  3. Investment recommendations
  4. Success probability assessment
  5. Executive summary
  
  Return as JSON with final recommendations.
  `

  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error("Agent 5 failed to get risk assessment")
  }

  const riskData = await response.json()

  // Compile final validation result strictly from AI + previous agents
  return {
    viability_score: riskData.viability_score,
    tam_data: allData.marketData.tam,
    sam_data: allData.marketData.sam,
    som_data: {
      obtainable_market: allData.marketData.sam.serviceable_market * 0.05,
      realistic_capture: 0.5,
      timeframe: "5_years",
    },
    swot_analysis: allData.competitorData.swot,
    competitor_analysis: {
      direct_competitors: allData.competitorData.competitors,
      competitive_advantage: allData.competitorData.competitive_advantage,
    },
    market_trends: allData.marketData.market_trends,
    usp: allData.businessPlan.usp,
    business_model: allData.businessPlan.business_model,
    risks_recommendations: {
      risks: riskData.risks,
      recommendations: riskData.recommendations,
    },
    business_plan: riskData.executive_summary,
    founder_scorecard: riskData.founder_scorecard,
    red_flags: riskData.red_flags,
    pivots: riskData.pivots,
    benchmarking: riskData.benchmarking,
    investor_appeal: riskData.investor_appeal,
    execution_roadmap: riskData.execution_roadmap,
  }
}

// Main orchestrator function
export async function validateIdeaWithMultipleAgents(ideaData: IdeaData): Promise<ValidationResult> {
  try {
    console.log("Starting multi-agent validation process...")

    // Agent 1: Summarize and structure the idea
    console.log("Agent 1: Analyzing and structuring idea...")
    const structuredIdea = await agent1_summarizeIdea(ideaData)

    // Agent 2: Scrape and analyze market data
    console.log("Agent 2: Researching market data...")
    const marketData = await agent2_scrapeMarketData(structuredIdea, ideaData.industry)

    // Agent 3: Analyze competitors and create SWOT
    console.log("Agent 3: Analyzing competitors...")
    const competitorData = await agent3_analyzeCompetitors(structuredIdea, marketData)

    // Agent 4: Generate business plan and GTM strategy
    console.log("Agent 4: Creating business plan...")
    const businessPlan = await agent4_generateBusinessPlan(structuredIdea, marketData, competitorData)

    // Agent 5: Assess risks and provide final scoring
    console.log("Agent 5: Final risk assessment and scoring...")
    const finalResult = await agent5_assessRisksAndScore({
      structuredIdea,
      marketData,
      competitorData,
      businessPlan,
    })

    console.log("Multi-agent validation completed successfully!")
    return finalResult
  } catch (error) {
    console.error("Multi-agent validation error:", error)
    throw error
  }
}
