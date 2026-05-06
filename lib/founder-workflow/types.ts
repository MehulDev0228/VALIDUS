export interface ValidationAttempt {
  id: string
  ideaKey: string
  ideaTitle: string
  actionTaken: string
  /** Free-text: what happened (outcomes, counts, objections). */
  result: string
  learnings: string
  createdAt: string
}

export interface DecisionRecord {
  id: string
  ideaId: string
  ideaKey?: string
  title?: string
  ideaTitle?: string
  verdict: "BUILD" | "PIVOT" | "KILL"
  opportunityScore?: number
  summary?: string
  createdAt?: string
  timestamp: string
}

export function ideaKeyFromIdea(idea: { title: string; description: string }): string {
  const slice = idea.description.slice(0, 120)
  let h = 0
  for (let i = 0; i < slice.length; i++) {
    h = (h << 5) - h + slice.charCodeAt(i)
    h |= 0
  }
  return `${idea.title.trim().toLowerCase().slice(0, 80)}::${(h >>> 0).toString(16)}`
}
