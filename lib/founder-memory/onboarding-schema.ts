import { z } from "zod"

/** Intake for founder framing — stored verbatim, no inference. */
export const FounderOnboardingBodySchema = z.object({
  founderStage: z.enum(["idea", "mvp", "early_revenue", "scaling", "explorer"]),
  technical: z.enum(["technical", "non_technical", "hybrid"]),
  market: z.enum(["b2b", "b2c", "both", "unsure"]),
  team: z.enum(["solo", "small_team", "larger"]),
  traction: z.enum(["none", "signals", "paying", "growth"]),
  experience: z.enum(["first_time", "repeat"]),
})

export type FounderOnboardingAnswers = z.infer<typeof FounderOnboardingBodySchema>

export const SKIP_ONBOARDING_DEFAULTS: FounderOnboardingAnswers = {
  founderStage: "idea",
  technical: "hybrid",
  market: "unsure",
  team: "solo",
  traction: "none",
  experience: "first_time",
}
