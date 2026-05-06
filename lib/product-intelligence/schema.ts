import { z } from "zod"

const KindZ = z.enum([
  "memo_first_open",
  "memo_revisit",
  "section_dwell",
  "specialist_notes_expand",
  "specialist_notes_collapse",
  "reflection_submitted",
  "experiment_logged",
  "execution_checkin_product",
  "workspace_home_open",
])

const EventZ = z.object({
  kind: KindZ,
  ideaId: z.string().max(128).optional(),
  ideaKey: z.string().max(200).optional(),
  verdict: z.string().max(12).optional(),
  sectionId: z.string().max(64).optional(),
  dwellMs: z.number().min(0).max(7_200_000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export const ProductIntelBatchSchema = z.object({
  events: z.array(EventZ).min(1).max(32),
})

export type ProductIntelBatchInput = z.infer<typeof ProductIntelBatchSchema>
