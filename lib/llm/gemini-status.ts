/**
 * Single source of truth for Gemini configuration (server + scripts).
 * Never log the API key.
 */

export function getResolvedGeminiModel(): string {
  return (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim()
}

export function isGeminiApiKeyPresent(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export type GeminiEnvStatus =
  | { ok: true; model: string }
  | { ok: false; missing: "GEMINI_API_KEY"; model: string }

export function getGeminiEnvStatus(): GeminiEnvStatus {
  const model = getResolvedGeminiModel()
  if (!isGeminiApiKeyPresent()) {
    return { ok: false, missing: "GEMINI_API_KEY", model }
  }
  return { ok: true, model }
}

export function formatGeminiEnvWarning(): string {
  const st = getGeminiEnvStatus()
  if (st.ok) return ""
  return [
    "[FutureValidate] Gemini is NOT configured.",
    `  Missing: ${st.missing}`,
    `  Resolved model (would be used): ${st.model}`,
    "  Add GEMINI_API_KEY to .env.local (see .env.example).",
    "  Without it, validation uses the local heuristic engine only — degraded, not calibrated.",
  ].join("\n")
}
