import { type IdeaInput } from "@/lib/schemas/idea"
import { type FreeValidationResponse } from "@/lib/schemas/free-validation"
import { heuristicFreeValidation } from "@/lib/kg"

// Free validation should be fast, deterministic, and zero-cost for the founder.
// This wrapper delegates to the local knowledge-graph + heuristic engine.
export async function runFreeValidation(idea: IdeaInput): Promise<FreeValidationResponse> {
  return heuristicFreeValidation(idea)
}
