import { getResolvedGeminiModel, isGeminiApiKeyPresent } from "@/lib/llm/gemini-status"

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
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini returned empty response")
  return JSON.parse(text)
}
