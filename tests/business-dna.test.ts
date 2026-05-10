import { describe, expect, it } from "vitest"
import { classifyIndustryFromIdea } from "@/lib/intelligence/industry-classification"
import { extractBusinessDNAHeuristic } from "@/lib/intelligence/business-dna"

describe("Business DNA extraction", () => {
  it("extracts industrial operational reality for factory automation ideas", () => {
    const idea = {
      title: "AI weld inspection for Tier-2 plants",
      description:
        "Computer vision mounted on line cameras catches weld defects, pushes tags into MES, and reduces scrap + downtime across automotive production cells.",
      industry: "manufacturing",
      targetMarket: "Automotive suppliers",
      revenueModel: "annual contract",
      keyFeatures: ["MES integration", "PLC signals", "line-side deployment"],
      useMode: "free",
    } as any

    const industry = classifyIndustryFromIdea(idea)
    const dna = extractBusinessDNAHeuristic(idea, industry)

    expect(dna.deploymentComplexity).toBe("extreme")
    expect(dna.implementationModel).toBe("embedded_integration_project")
    expect(dna.integrationBurden).toBe("high")
    expect(dna.salesMotion).toBe("enterprise_field")
    expect(dna.fundamentalOffering.toLowerCase()).toContain("production")
  })

  it("separates marketplace operational logic when explicitly two-sided", () => {
    const idea = {
      title: "Regional contractor supply marketplace",
      description:
        "Two-sided marketplace matching contractors with suppliers, with take rate and payouts. Trust scoring reduces no-show and late payment risk.",
      industry: "construction",
      targetMarket: "SMB contractors",
      revenueModel: "take rate",
      keyFeatures: ["payouts", "ratings", "matching"],
      useMode: "free",
    } as any

    const industry = classifyIndustryFromIdea(idea)
    const dna = extractBusinessDNAHeuristic(idea, industry)

    expect(dna.salesMotion).toBe("marketplace_operator")
    expect(dna.retentionMechanism).toBe("network_density")
    expect(dna.coreEconomicDriver.toLowerCase()).toContain("take rate")
  })
})

