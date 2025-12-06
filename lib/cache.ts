import { IdeaInput } from "@/lib/schemas/idea"
import { FreeValidationResponse } from "@/lib/schemas/free-validation"
import { FullValidationResponse } from "@/lib/schemas/premium-validation"

function normalizeIdeaInput(idea: IdeaInput): Record<string, unknown> {
  return {
    title: idea.title.trim().toLowerCase(),
    description: idea.description.trim().toLowerCase(),
    industry: idea.industry?.trim().toLowerCase() ?? null,
    targetMarket: idea.targetMarket?.trim().toLowerCase() ?? null,
    revenueModel: idea.revenueModel?.trim().toLowerCase() ?? null,
    keyFeatures: (idea.keyFeatures ?? []).map((f) => f.trim().toLowerCase()).sort(),
    useMode: idea.useMode ?? "free",
  }
}

function ideaKey(idea: IdeaInput): string {
  const normalized = normalizeIdeaInput(idea)
  return JSON.stringify(normalized)
}

const freeCache = new Map<string, FreeValidationResponse>()
const premiumCache = new Map<string, FullValidationResponse>()

export function getCachedFreeValidation(idea: IdeaInput): FreeValidationResponse | null {
  const key = ideaKey(idea)
  return freeCache.get(key) ?? null
}

export function setCachedFreeValidation(idea: IdeaInput, result: FreeValidationResponse): void {
  const key = ideaKey(idea)
  freeCache.set(key, result)
}

export function getCachedPremiumValidation(idea: IdeaInput): FullValidationResponse | null {
  const key = ideaKey(idea)
  return premiumCache.get(key) ?? null
}

export function setCachedPremiumValidation(idea: IdeaInput, result: FullValidationResponse): void {
  const key = ideaKey(idea)
  premiumCache.set(key, result)
}
