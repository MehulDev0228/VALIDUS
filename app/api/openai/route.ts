import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    const openaiApiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      )
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert startup analyst. Always respond with valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      return NextResponse.json(
        { error: `OpenAI API error ${response.status}: ${text}` },
        { status: 500 },
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "Empty OpenAI response" }, { status: 500 })
    }

    // content should already be valid JSON because of response_format
    try {
      const parsed = JSON.parse(content)
      return NextResponse.json(parsed)
    } catch {
      // As a last resort, return the raw content
      return NextResponse.json({ raw: content }, { status: 200 })
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    )
  }
}
