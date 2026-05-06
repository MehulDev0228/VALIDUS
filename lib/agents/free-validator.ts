import { type IdeaInput } from "@/lib/schemas/idea"
import { type FreeValidationResponse } from "@/lib/schemas/free-validation"
import { heuristicReport, runFreeValidationPipeline } from "@/lib/agents/free-pipeline"
import { queryKnowledgeGraph } from "@/lib/kg"
import { formatGeminiEnvWarning, getGeminiEnvStatus } from "@/lib/llm/gemini-status"

let warnedGeminiMissingThisProcess = false

function withEngineMeta(
  response: FreeValidationResponse,
  patch: {
    degraded: boolean
    degradedReason: string | null
    enginePath: "gemini_pipeline" | "heuristic_fallback"
  },
): FreeValidationResponse {
  return {
    ...response,
    metadata: {
      ...response.metadata,
      degraded: patch.degraded,
      degradedReason: patch.degradedReason,
      enginePath: patch.enginePath,
    },
  }
}

export async function runFreeValidation(idea: IdeaInput): Promise<FreeValidationResponse> {
  const status = getGeminiEnvStatus()

  if (!status.ok) {
    if (!warnedGeminiMissingThisProcess) {
      warnedGeminiMissingThisProcess = true
      console.warn(formatGeminiEnvWarning())
    }
    const h = heuristicReport(idea, queryKnowledgeGraph(idea, 14))
    return withEngineMeta(h, {
      degraded: true,
      degradedReason: "GEMINI_API_KEY missing — heuristic pattern-graph engine (no LLM)",
      enginePath: "heuristic_fallback",
    })
  }

  try {
    const result = await runFreeValidationPipeline(idea)
    return withEngineMeta(result, {
      degraded: false,
      degradedReason: null,
      enginePath: "gemini_pipeline",
    })
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Gemini pipeline error — heuristic fallback"
    console.error("[FutureValidate] v2 Gemini pipeline failed, using heuristic fallback:", err)
    const h = heuristicReport(idea, queryKnowledgeGraph(idea, 14))
    return withEngineMeta(h, {
      degraded: true,
      degradedReason: reason,
      enginePath: "heuristic_fallback",
    })
  }
}
