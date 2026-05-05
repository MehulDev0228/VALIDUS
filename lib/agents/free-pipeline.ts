import { IdeaInput } from "@/lib/schemas/idea"
import { FreeValidationResponse, FreeValidationResponseSchema } from "@/lib/schemas/free-validation"
import { queryKnowledgeGraph } from "@/lib/kg"
import { generateGeminiJson } from "@/lib/llm/gemini-json"

type AgentLean = "BUILD" | "PIVOT" | "KILL"

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function classifyFromDecision(decision: AgentLean): FreeValidationResponse["classification"] {
  if (decision === "BUILD") return "high"
  if (decision === "PIVOT") return "possible"
  return "low"
}

function enforceHardLanguage(lines: string[]): string[] {
  const banned = /\b(maybe|might|could|possibly|perhaps|shows promise|has potential)\b/gi
  return lines.map((line) => line.replace(banned, "").replace(/\s{2,}/g, " ").trim())
}

function heuristicContext(idea: IdeaInput) {
  const keywords = [idea.industry, idea.revenueModel, ...(idea.keyFeatures || []), idea.targetMarket]
    .filter(Boolean)
    .map((x) => String(x).trim())
    .slice(0, 12)

    return {
    problem: idea.description.slice(0, 220),
    targetUser: idea.targetMarket || "Unclear target user",
    market: idea.industry || "General market",
    coreIdea: idea.title,
    keywords,
    searchQueries: [
      `market size ${idea.industry || "startup category"} ${idea.targetMarket || ""}`.trim(),
      `startup failure reasons ${idea.industry || "this domain"}`.trim(),
      `competitors for ${idea.title}`.trim(),
    ],
    missingAssumptions: [
      "Why this customer buys now",
      "Acquisition channel economics",
      "Retention trigger after first use",
    ],
    validationGaps: [
      "Proof that users switch from current behavior",
      "Evidence that unit economics can work",
      "Short-cycle demand test with real users",
    ],
  }
}

function defaultExecutionPlanner48h(): NonNullable<FreeValidationResponse["executionPlanner48h"]> {
  return [
    {
      order: 1,
      day: "Day 1 (0-24h)",
      action:
        "Post one specificity test in two channels: Reddit (subreddit thread) OR niche Slack/Discord, plus 10 LinkedIn DMs to titled ICP.",
      platforms: ["Reddit", "LinkedIn"],
      expectedSignals: "Comments or replies naming the pain in their words; DM accept + reply rate above noise.",
      successIf:
        "If you get ≥3 substantive replies OR ≥2 booked calls → continue tightening the wedge and double volume Day 2.",
      failIf: "If silence or vague cheerleading after 24h → rewrite ICP + hook; same test once more before pivot.",
    },
    {
      order: 2,
      day: "Day 1-2",
      action: "Standalone landing page: headline, proof gap, pricing anchor, Stripe/pilot deposit CTA. Share link in Reddit + LinkedIn + X.",
      platforms: ["Reddit", "LinkedIn", "X"],
      expectedSignals: "Click-through from ICP-ish visitors; replies asking about scope and price.",
      successIf: "If ≥20 qualified visits OR ≥5 waits on calendar OR pilot deposit intent → continue building sell motion.",
      failIf: "If traffic dies or zero intent signals → kill page angle; try wedge #2 stated in IdeaContext.validationGaps.",
    },
    {
      order: 3,
      day: "Day 2 (24-48h)",
      action: "Cold email or DM script v2 referencing one measurable outcome + ask for prepaid pilot.",
      platforms: ["Email", "LinkedIn"],
      expectedSignals: "Objections tied to buying (security, SLA, onboarding) versus polite brush-off.",
      successIf:
        "If someone pays pilot / signs SOW / gives LOI → continue building delivery; defer product breadth.",
      failIf:
        "If nobody pays after ~25 quality touches → pivot positioning or kill; do not bury in build work.",
    },
  ]
}

function normalizeExecutionPlanner48h(raw: unknown): NonNullable<FreeValidationResponse["executionPlanner48h"]> {
  if (!Array.isArray(raw) || raw.length === 0) return defaultExecutionPlanner48h()
  const mapped = raw
    .map((x: any, i: number) => ({
      order: typeof x?.order === "number" ? x.order : i + 1,
      day: x?.day ? String(x.day).trim() : undefined,
      action: String(x?.action || x?.step || "").trim(),
      platforms: Array.isArray(x?.platforms)
        ? x.platforms.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 8)
        : undefined,
      expectedSignals: x?.expectedSignals ? String(x.expectedSignals).trim() : undefined,
      successIf: String(x?.successIf || x?.successCondition || x?.continueIf || "").trim(),
      failIf: String(x?.failIf || x?.failureCondition || x?.pivotOrKillIf || "").trim(),
    }))
    .filter((x) => x.action.length > 0)
  return mapped.length > 0 ? mapped : defaultExecutionPlanner48h()
}

function inferCountry(idea: IdeaInput): string {
  const text = `${idea.title} ${idea.description} ${idea.targetMarket || ""} ${idea.industry || ""}`.toLowerCase()
  if (text.includes("india") || text.includes("indian") || text.includes("bharat")) return "India"
  if (text.includes("usa") || text.includes("united states") || text.includes("us ")) return "United States"
  if (text.includes("uk") || text.includes("united kingdom") || text.includes("britain")) return "United Kingdom"
  if (text.includes("uae") || text.includes("dubai") || text.includes("emirates")) return "UAE"
  return "Primary market unspecified"
}

function heuristicReport(idea: IdeaInput, kgNames: string[]): FreeValidationResponse {
  const context = heuristicContext(idea)
  const topRisks = [
    "Distribution assumptions are weak and likely optimistic.",
    "Differentiation is not hard enough to survive competition.",
    "Pricing power is unproven; monetization collapses under CAC.",
  ]
  const fastPlan = [
    "Create one landing page with a hard value proposition and paid pilot CTA.",
    "Run 20 targeted outreach messages to the exact ICP and ask for paid commitment.",
    "Kill or pivot if fewer than 3 high-intent calls are booked in 48 hours.",
  ]
  const decision: AgentLean = "PIVOT"
  const brutalSummaryHeuristic = "PIVOT: Demand is unproven; paid intent clears the clutter."
  return {
    ideaSummary: `${idea.title}: ${idea.description.slice(0, 180)}`,
    ideaContext: context,
    researchInsights: [
      {
        title: "Nexus pulse",
        finding: "Market noise exists, but evidence quality is weak without direct customer signals.",
        implication: "Do not build product depth before validating demand with paid intent.",
        confidence: 0.62,
        sourceType: "nexus",
      },
      {
        title: "Comparable patterns",
        finding: kgNames.length > 0 ? `Closest analogues: ${kgNames.join(", ")}` : "No strong analogues identified.",
        implication: "You either found whitespace or your framing is too vague for category fit.",
        confidence: 0.55,
        sourceType: "kg",
      },
    ],
    agentInsights: [
      {
        agent: "RiskFailureAgent",
        stance: "critical",
        confidence: 0.82,
        evidence: ["Unproven distribution model", "Weak switching incentive"],
        insights: [
          "This idea fails fast if users can keep using current tools with near-zero pain.",
          "If your first wedge is not mandatory, retention drops after novelty fades.",
        ],
        verdictLean: "KILL",
      },
    ],
    whyThisIdeaWillLikelyFail: topRisks,
    fastestWayToProveWrong48h: fastPlan,
    executionPlan: fastPlan,
    executionPlanner48h: defaultExecutionPlanner48h(),
    keyRisks: topRisks,
    opportunityScore: 52,
    finalVerdict: {
      decision,
      brutalSummary: brutalSummaryHeuristic,
      ifWorksBecause:
        "A narrow wedge creates pull from one ICP while paid pilots finance the next sprint before scale.",
      ifFailsBecause:
        "Weak distribution meets copyable differentiation; churn wins while CAC climbs.",
      confidence: 0.64,
      topReasons: [
        "Problem is plausible but willingness to pay is not validated.",
        "Go-to-market assumptions are fragile.",
        "Differentiation can be copied quickly.",
      ],
      topRisks,
    },
    classification: classifyFromDecision(decision),
    score: 5.2,
    summary: brutalSummaryHeuristic,
    topRisks,
    pivots: [
      { title: "Narrow ICP hard", why: "Pick one role with urgent pain and measurable ROI." },
      { title: "Sell before build", why: "Get commitments first to avoid fake demand." },
      { title: "One brutal wedge", why: "Solve one expensive problem end-to-end." },
    ],
    comparables: kgNames.map((name) => ({ name, reason: "KG analogue", url: undefined })),
    tamSamSom: {
      TAM: "Heuristic estimate only",
      SAM: "Needs real customer discovery",
      SOM: "Uncertain without GTM proof",
      confidence: "low",
      assumptions: ["No external paid data sources used."],
    },
    metadata: {
      sourceKeysUsed: ["gemini-v2", "local-kg-v1"],
      cached: false,
      generatedAt: new Date().toISOString(),
      needsReview: false,
      needsReviewReason: null,
    },
  }
}

function agentPrompt(role: string, ideaContext: any, researchInsights: any[], contradictionHints: string[]): string {
  const styleByRole: Record<string, string> = {
    MarketResearchAgent:
      "Style: data-heavy and analytical. Use market structure thinking, trend logic, and quantified framing. Cite concrete ranges and directional numbers when uncertain.",
    CompetitorAgent:
      "Style: aggressive and confrontational. Expose saturation, weak differentiation, and copyability. Treat founder claims as guilty until proven unique.",
    MonetizationAgent:
      "Style: practical and revenue-first. Focus on willingness to pay, budget ownership, pricing friction, and payback reality.",
    FeasibilityAgent:
      "Style: technical and systems-focused. Decompose architecture, integration burden, reliability, compliance, and delivery risk.",
    ICPAgent:
      "Style: psychological and user-empathy sharp. Analyze buyer anxiety, status incentives, behavior inertia, and switching pain.",
    RiskFailureAgent:
      "Style: brutal and destructive. Actively try to kill the idea. Highlight failure chains, downside scenarios, and hidden fatal assumptions.",
    ValidationStrategyAgent:
      "Style: tactical and speed-obsessed. Design fast falsification experiments with clear pass/fail signals inside 48 hours.",
  }

  return `You are ${role} in FutureValidate v2, a brutally honest startup validator.
Return JSON: {"insights": string[], "evidence": string[], "confidence": number, "verdictLean":"BUILD|PIVOT|KILL", "stance":"supportive|critical|mixed"}.
Rules:
- Be direct, sharp, no fluff.
- Challenge assumptions aggressively.
- Mention at least one falsification test.
- Use contradiction hints when relevant.
- Sound distinct from other agents.
- Avoid repeating stock phrasing used by generic AI assistants.
- Write short, high-signal points; no filler intros.
${styleByRole[role] || "Style: decisive and critical."}
IdeaContext: ${JSON.stringify(ideaContext)}
ResearchInsights: ${JSON.stringify(researchInsights)}
ContradictionHints: ${JSON.stringify(contradictionHints)}`
}

export async function runFreeValidationPipeline(idea: IdeaInput): Promise<FreeValidationResponse> {
  const kg = queryKnowledgeGraph(idea, 4)
  const kgNames = kg.map((k) => k.name).slice(0, 4)

  try {
    const contextRaw = await generateGeminiJson(
      `Extract IdeaContext JSON with keys:
{"problem","targetUser","market","coreIdea","keywords","searchQueries","missingAssumptions","validationGaps"}.
Return concise but specific content.
Input: ${JSON.stringify(idea)}`,
    )
    const ideaContext = {
      ...heuristicContext(idea),
      ...contextRaw,
    }
    const country = inferCountry(idea)

    const researchRaw = await generateGeminiJson(
      `Act as FutureValidate Nexus Research Orchestrator with consulting-grade thinking.
You must NOT produce generic market fluff.
Return strict JSON:
{
  "researchInsights":[
    {
      "title":"string",
      "country":"string",
      "trendObservation":"string",
      "whyItMatters":"string",
      "strategicImplication":"string",
      "opportunityAngle":"string",
      "finding":"string",
      "implication":"string",
      "confidence": number,
      "sourceType":"nexus|gemini-simulated|kg"
    }
  ],
  "contradictionsToProbe": string[]
}
Rules:
- Every insight must be country-specific for ${country}.
- Ban vague language like "growing market", "huge opportunity", "increasing demand" without concrete context.
- Use sharp observations (example style: "Tier-2 India shows rising digital adoption but low SaaS willingness to pay").
- Each insight must contain all four consulting blocks:
  trendObservation, whyItMatters, strategicImplication, opportunityAngle.
- Keep each field concise and non-repetitive.
Context:
IdeaContext=${JSON.stringify(ideaContext)}
KGComparables=${JSON.stringify(kgNames)}
If hard data is unavailable, still provide high-quality simulated strategic observations and label sourceType as gemini-simulated.`,
    )
    const researchInsights = Array.isArray(researchRaw?.researchInsights)
      ? researchRaw.researchInsights.map((insight: any) => ({
          ...insight,
          country: insight?.country || country,
          trendObservation: insight?.trendObservation || insight?.finding || "Trend signal unavailable",
          whyItMatters: insight?.whyItMatters || insight?.implication || "Strategic relevance not specified",
          strategicImplication: insight?.strategicImplication || insight?.implication || "Implication not specified",
          opportunityAngle: insight?.opportunityAngle || "No concrete opportunity angle provided",
          finding: insight?.finding || insight?.trendObservation || "No finding provided",
          implication:
            insight?.implication || insight?.strategicImplication || "No implication provided",
        }))
      : []
    const contradictionHints = Array.isArray(researchRaw?.contradictionsToProbe) ? researchRaw.contradictionsToProbe : []

    const agentRoles = [
      "MarketResearchAgent",
      "CompetitorAgent",
      "MonetizationAgent",
      "FeasibilityAgent",
      "ICPAgent",
      "RiskFailureAgent",
      "ValidationStrategyAgent",
    ]

    const outputs = await Promise.all(
      agentRoles.map(async (role) => {
        const raw = await generateGeminiJson(agentPrompt(role, ideaContext, researchInsights, contradictionHints))
    return {
          agent: role,
          stance: raw?.stance || (role === "RiskFailureAgent" ? "critical" : "mixed"),
          confidence: clampConfidence(Number(raw?.confidence ?? 0.6)),
          evidence: Array.isArray(raw?.evidence) ? raw.evidence.slice(0, 4) : [],
          insights: Array.isArray(raw?.insights) ? raw.insights.slice(0, 4) : [],
          verdictLean: (raw?.verdictLean || "PIVOT") as AgentLean,
        }
      }),
    )

    if (!outputs.some((o) => o.agent === "RiskFailureAgent" && o.stance === "critical")) {
      outputs.push({
        agent: "RiskFailureAgent",
        stance: "critical",
        confidence: 0.85,
        evidence: ["Missing hard demand proof"],
        insights: ["This dies if users will not pay or switch within 30 days."],
        verdictLean: "KILL",
      })
    }

    const judgeRaw = await generateGeminiJson(
      `You are FinalJudgeAgent. You must be decisive and opinionated.
Return JSON {"decision":"BUILD|PIVOT|KILL","brutalSummary":string,"ifWorksBecause":string,"ifFailsBecause":string,"confidence":number,"topReasons":string[],"topRisks":string[],"opportunityScore":number,"whyFail":string[],"proveWrong48h":string[],"executionPlan":string[],"executionPlanner48h":[{"order":1,"day":string,"action":string,"platforms":string[],"expectedSignals":string,"successIf":string,"failIf":string}]}
Resolve contradictions and pick one decision only.
Language rules:
- No soft language.
- Do not use words like maybe, might, could, perhaps, possible.
- brutalSummary must be one line, direct, and final.
- ifWorksBecause: one sharp sentence. Start with the concrete mechanism (distribution, wedge, buyer pull, etc.).
- ifFailsBecause: one sharp sentence. Name the fatal failure mode, not generic risk.
- Put verdict first, then reasoning in topReasons.
- executionPlanner48h: 4-6 steps spanning 48 hours; each step MUST include day (Day 1 / Day 2 label), concrete action, platforms array (pick from Reddit, LinkedIn, X/Twitter, cold email, Product Hunt, Indie Hackers, Slack/Discord communities, etc.), expectedSignals, successIf (= if X → continue), failIf (= if not → pivot or kill).
AgentOutputs: ${JSON.stringify(outputs)}
ResearchInsights: ${JSON.stringify(researchInsights)}
IdeaContext: ${JSON.stringify(ideaContext)}`,
    )

    const decision: AgentLean = (judgeRaw?.decision || "PIVOT") as AgentLean
    const topRisks: string[] = enforceHardLanguage(
      Array.isArray(judgeRaw?.topRisks) ? judgeRaw.topRisks.slice(0, 5) : [],
    )
    const topReasons: string[] = enforceHardLanguage(
      (judgeRaw?.topReasons || ["No strong reason returned"]).slice(0, 3),
    )
    const brutalSummary =
      String(judgeRaw?.brutalSummary || "").trim() ||
      (decision === "KILL"
        ? "KILL: This idea fails because distribution is weak and differentiation is fragile."
        : decision === "PIVOT"
          ? "PIVOT: Current strategy loses; narrow the wedge and validate paid demand immediately."
          : "BUILD: The opportunity is real, but only if you execute with ruthless focus.")
    const ifWorksBecause = enforceHardLanguage([
      String(judgeRaw?.ifWorksBecause || "").trim() ||
        (decision === "BUILD"
          ? "You win by locking a distribution channel your competitors cannot copy in 12 months."
          : decision === "PIVOT"
            ? "You win by shipping one wedge that forces paid usage before you scale the story."
            : "Resurrection requires a new wedge: sharper ICP, paid pilots, and cash before scale."),
    ])[0]
    const ifFailsBecause = enforceHardLanguage([
      String(judgeRaw?.ifFailsBecause || "").trim() ||
        (topRisks[0] ||
          "This dies on distribution: no repeatable channel and no reason for buyers to leave the status quo."),
    ])[0]
    const response: FreeValidationResponse = {
      ideaSummary: `${idea.title}: ${idea.description.slice(0, 180)}`,
      ideaContext,
      researchInsights: researchInsights.slice(0, 6),
      agentInsights: outputs,
      opportunityScore: Math.max(0, Math.min(100, Number(judgeRaw?.opportunityScore ?? 50))),
      finalVerdict: {
        decision,
        brutalSummary,
        ifWorksBecause,
        ifFailsBecause,
        confidence: clampConfidence(Number(judgeRaw?.confidence ?? 0.65)),
        topReasons,
        topRisks: topRisks.length > 0 ? topRisks : ["Risk analysis incomplete"],
      },
      whyThisIdeaWillLikelyFail: (judgeRaw?.whyFail || topRisks).slice(0, 5),
      fastestWayToProveWrong48h: (judgeRaw?.proveWrong48h || []).slice(0, 5),
      executionPlan: (judgeRaw?.executionPlan || []).slice(0, 6),
      executionPlanner48h: normalizeExecutionPlanner48h(judgeRaw?.executionPlanner48h),
      classification: classifyFromDecision(decision),
      score: Number(((Number(judgeRaw?.opportunityScore ?? 50)) / 10).toFixed(1)),
      summary: brutalSummary,
      topRisks: topRisks.length > 0 ? topRisks : ["Insufficient risk detail"],
      pivots: [
        { title: "Tighten ICP", why: "Reduce ambiguity and improve conversion learning speed." },
        { title: "Run paid tests first", why: "Revenue intent beats survey enthusiasm." },
        { title: "Cut scope", why: "Ship one wedge before platform ambitions." },
      ],
      comparables: kgNames.map((name) => ({ name, reason: "KG analogue", url: undefined })),
      tamSamSom: {
        TAM: "Research-backed estimate pending external validation",
        SAM: "Narrow segment to be validated with outreach",
        SOM: "Derived from 48h tests + first pilots",
        confidence: "low",
        assumptions: ["Gemini-generated strategic estimates; validate with primary data."],
      },
      metadata: {
        sourceKeysUsed: ["gemini-v2", "local-kg-v1"],
        cached: false,
        generatedAt: new Date().toISOString(),
        needsReview: false,
        needsReviewReason: null,
      },
    }
    return FreeValidationResponseSchema.parse(response)
  } catch {
    return FreeValidationResponseSchema.parse(heuristicReport(idea, kgNames))
  }
}
