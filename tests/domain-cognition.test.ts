import { describe, it, expect } from "vitest"
import { classifyIndustryFromIdea } from "@/lib/intelligence/industry-classification"
import { buildPatternGraph } from "@/lib/intelligence/pattern-mapper"

describe("domain cognition routing", () => {
  it("classifies robotics factory pitch as manufacturing, not marketplace templates", () => {
    const idea = {
      title: "LineSight weld QC",
      description:
        "Computer vision on the assembly line flags weld defects before EOL test; integrates with plant MES and reduces scrap rate on automotive Tier-2 runs.",
      industry: "Manufacturing",
      targetMarket: "Automotive suppliers",
      revenueModel: "Per line SaaS",
      keyFeatures: ["PLC handshake", "scrap tagging", "OEE dashboard"],
      useMode: "free",
    } as any

    const ic = classifyIndustryFromIdea(idea)
    expect(ic.primaryVertical).toBe("manufacturing_robotics")

    const graph = buildPatternGraph(idea, ic)
    expect(graph.effectiveArchetype).not.toBe("marketplace")
  })

  it("still allows explicit marketplace ideas to route as marketplace archetype", () => {
    const idea = {
      title: "Regional crafts marketplace",
      description:
        "Two-sided marketplace matching indie makers with boutiques; we charge take rate on orders and manage payouts.",
      industry: "Retail tech",
      targetMarket: "Independent boutiques",
      revenueModel: "Take rate",
      keyFeatures: ["seller onboarding", "trust reviews"],
      useMode: "free",
    } as any

    const ic = classifyIndustryFromIdea(idea)
    expect(ic.primaryVertical).toBe("marketplaces")

    const graph = buildPatternGraph(idea, ic)
    expect(graph.effectiveArchetype).toBe("marketplace")
  })
})
