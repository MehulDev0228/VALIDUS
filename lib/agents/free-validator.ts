import { type IdeaInput } from "@/lib/schemas/idea"
import { type FreeValidationResponse } from "@/lib/schemas/free-validation"
import { runFreeValidationPipeline } from "@/lib/agents/free-pipeline"
import { heuristicFreeValidation } from "@/lib/kg"

export async function runFreeValidation(idea: IdeaInput): Promise<FreeValidationResponse> {
  try {
    return await runFreeValidationPipeline(idea)
  } catch (err) {
    console.error("FutureValidate v2 pipeline failed, falling back to heuristic engine:", err)
    return heuristicFreeValidation(idea)
  }
}
