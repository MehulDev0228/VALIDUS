import { describe, it, expect } from "vitest"
import { heuristicFreeValidation } from "../lib/kg"

// Deterministic test for the India B2B Payment Trust Grid idea.
describe("heuristicFreeValidation - India B2B Payment Trust Grid", () => {
  it("produces domain-aware risks, pivots, and explanation", () => {
    const result = heuristicFreeValidation({
      title: "India B2B Payment Trust Grid",
      description:
        "A platform that scores how reliably businesses pay their vendors—and rewards the best payers with more visibility, trust, and new customers. It builds India’s B2B Payment Trust Grid, a reputation layer where companies’ payment behaviours become transparent and economically meaningful. Early-paying businesses rise in visibility in a trust-based marketplace; late payers lose credibility and sourcing opportunities.",
      industry: "fintech",
      targetMarket:
        "MSME/SME vendors in India and mid–large enterprises/corporates with complex vendor ecosystems.",
      revenueModel: "saas",
      keyFeatures: [
        "Payment Behaviour Score",
        "Trust Marketplace",
        "multi-state invoice classification",
        "automated invoice sync",
      ],
      useMode: "free",
    } as any)

    // Top risks should be non-empty and include domain-specific content.
    expect(result.topRisks.length).toBeGreaterThanOrEqual(3)
    const risksText = result.topRisks.join(" ").toLowerCase()
    expect(risksText).toContain("invoice")
    expect(risksText).toContain("data")

    // Pivots should be concrete and reference lenders/verticals/credit-like concepts.
    expect(result.pivots.length).toBeGreaterThanOrEqual(3)
    const pivotsText = result.pivots.map((p) => `${p.title} ${p.why}`).join(" ").toLowerCase()
    expect(pivotsText).toMatch(/lender|credit|vertical|supply chain/)

    // Long report should clearly reference India, B2B payments, and invoice/data access topics.
    const longText = (result.longReport?.text || "").toLowerCase()
    expect(longText).toContain("india")
    expect(longText).toContain("b2b")
    expect(longText).toContain("invoice")
    expect(longText).toContain("data")
  })
})