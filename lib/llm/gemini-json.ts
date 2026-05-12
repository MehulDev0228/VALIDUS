import { getResolvedGeminiModel, isGeminiApiKeyPresent } from "@/lib/llm/gemini-status"

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error("Could not parse JSON from Gemini response")
  }
}

function parseGenerateContentJson(data: unknown): unknown {
  const d = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const parts = d?.candidates?.[0]?.content?.parts
  const texts = Array.isArray(parts) ? parts.map((p) => p?.text).filter(Boolean) : []
  const text = texts.join("\n")
  if (!text) throw new Error("Gemini returned empty response")
  return extractJsonObject(text)
}

export async function generateGeminiJson(prompt: string): Promise<any> {
  if (!isGeminiApiKeyPresent()) {
    throw new Error("Missing GEMINI_API_KEY — cannot call Gemini")
  }
  const model = getResolvedGeminiModel()
  const apiKey = process.env.GEMINI_API_KEY as string
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Gemini request failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return parseGenerateContentJson(data)
}

export type ResearchGeminiResult = { parsed: any; groundingUsed: boolean }

/**
 * Research insights call — optionally uses Grounding with Google Search when
 * GEMINI_GROUNDING_SEARCH is not "0" (default: on). Falls back to plain JSON on errors.
 */
export async function generateGeminiJsonForResearch(prompt: string): Promise<ResearchGeminiResult> {
  if (!isGeminiApiKeyPresent()) {
    throw new Error("Missing GEMINI_API_KEY — cannot call Gemini")
  }
  const model = getResolvedGeminiModel()
  const apiKey = process.env.GEMINI_API_KEY as string
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const enableGrounding = process.env.GEMINI_GROUNDING_SEARCH !== "0"

  async function post(body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return res
  }

  const baseBody: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  }

  if (enableGrounding) {
    const groundedBody = {
      ...baseBody,
      tools: [{ google_search: {} }],
    }
    const res = await post(groundedBody)
    if (res.ok) {
      const data = await res.json()
      try {
        return { parsed: parseGenerateContentJson(data), groundingUsed: true }
      } catch {
        /** fall through to non-grounded */
      }
    } else {
      const errText = await res.text().catch(() => "")
      console.warn("[gemini] grounded research failed, retrying without tools:", res.status, errText.slice(0, 200))
    }
  }

  const res2 = await post(baseBody)
  if (!res2.ok) {
    const text = await res2.text().catch(() => "")
    throw new Error(`Gemini research failed: ${res2.status} ${text}`)
  }
  const data2 = await res2.json()
  return { parsed: parseGenerateContentJson(data2), groundingUsed: false }
}
