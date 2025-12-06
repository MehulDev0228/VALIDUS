export interface SerperResultSnippet {
  title: string
  url: string
  snippet: string
}

export interface SerperSearchResponse {
  query: string
  results: SerperResultSnippet[]
}

const SERPER_API_KEY = process.env.SERPER_API_KEY
const SERPER_BASE_URL = process.env.SERPER_BASE_URL || "https://google.serper.dev/search"

export async function searchSerper(query: string): Promise<SerperSearchResponse> {
  if (!SERPER_API_KEY) {
    // In local/dev without a key, return an empty response.
    return { query, results: [] }
  }

  const res = await fetch(SERPER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": SERPER_API_KEY,
    },
    body: JSON.stringify({
      q: query,
      num: 5,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Serper error ${res.status}: ${text}`)
  }

  const data = await res.json()

  const results: SerperResultSnippet[] = (data.organic || []).slice(0, 5).map((item: any) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
  }))

  return { query, results }
}
