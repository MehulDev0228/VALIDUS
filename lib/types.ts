export interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string
  industry?: string
  target_market?: string
  revenue_model?: string
  key_features?: string[]
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
}

export interface ValidationReport {
  id: string
  idea_id: string
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
  viability_score: number
  usp: string
  business_model: string
  risks_recommendations: {
    risks: string[]
    recommendations: string[]
  }
  business_plan: string
  created_at: string
}

export interface WaitlistEntry {
  id: string
  email: string
  source: string
  created_at: string
}
