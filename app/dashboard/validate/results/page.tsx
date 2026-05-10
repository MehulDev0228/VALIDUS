import { Suspense } from "react"
import { ValidationResultsExperience } from "./validation-results-client"

export default function ValidationResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-0" aria-hidden />}>
      <ValidationResultsExperience />
    </Suspense>
  )
}
