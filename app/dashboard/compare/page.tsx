import { Suspense } from "react"
import { CompareClient } from "./compare-client"

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <Suspense fallback={<div className="mono-caption px-6 py-16 text-bone-2">Loading…</div>}>
        <CompareClient />
      </Suspense>
    </div>
  )
}
