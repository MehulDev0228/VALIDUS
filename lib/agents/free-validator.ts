import { type IdeaInput } from "@/lib/schemas/idea"
import { type FreeValidationResponse } from "@/lib/schemas/free-validation"
import { runFreeValidationPipeline } from "@/lib/agents/free-pipeline"
import { heuristicFreeValidation } from "@/lib/kg"

const ENABLE_LLM_FREE_PIPELINE = process.env.FREE_VALIDATION_USE_LLM === "true"

// Free validation should be fast and effectively zero-cost for you. By default we
// run only the heuristic + KG engine. If you *explicitly* enable the LLM-backed
// pipeline via FREE_VALIDATION_USE_LLM=true, we will try the multi-agent flow
// and fall back to heuristics on any error.
export async function runFreeValidation(idea: IdeaInput): Promise<FreeValidationResponse> {
  if (!ENABLE_LLM_FREE_PIPELINE) {
    return heuristicFreeValidation(idea)
  }

  try {
    return await runFreeValidationPipeline(idea)
  } catch (err) {
    console.error("runFreeValidationPipeline failed, falling back to heuristic engine:", err)
    return heuristicFreeValidation(idea)
  }
}
