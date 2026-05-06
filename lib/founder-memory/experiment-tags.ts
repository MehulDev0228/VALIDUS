/** Cheap keyword tags on experiment text — optional, for aggregation only. */

export function inferExperimentObservationTags(action: string, outcome: string, learnings: string): string[] {
  const t = `${action}\n${outcome}\n${learnings}`.toLowerCase()
  const tags: string[] = []
  if (/\b(nobody|no\s+response|ghost|ignored|silence)\b/i.test(t)) tags.push("weak_response")
  if (/\b(click|ctr|traffic|landing)\b/i.test(t) && /\b(zero|none|no\s+)\b/i.test(t)) tags.push("no_engagement")
  if (/\b(waitlist)\b/i.test(t)) tags.push("waitlist_signal")
  if (/\b(paid|deposit|card|stripe|invoice)\b/i.test(t)) tags.push("money_signal")
  if (/\b(retention|returned|came\s+back|repeat)\b/i.test(t)) tags.push("retention_signal")
  if (/\b(onboarding|signup|activated)\b/i.test(t) && /\b(pain|confus|drop|abandon)\b/i.test(t))
    tags.push("onboarding_friction")
  if (/\b(referral|forward|invite|shared)\b/i.test(t) && /\b(good|strong|high)\b/i.test(t)) tags.push("referral_pull")
  return [...new Set(tags)].slice(0, 24)
}
