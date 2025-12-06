import { z } from "zod"

export const FreeValidationResponseSchema = z.object({
  classification: z.enum(["high", "possible", "low", "joke"]),
  score: z.number().min(0).max(10),
  summary: z.string(),
  topRisks: z.array(z.string()).max(5),
  pivots: z
    .array(
      z.object({
        title: z.string(),
        why: z.string(),
      }),
    )
    .max(10),
  comparables: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      url: z.string().url().optional(),
    }),
  ),
  tamSamSom: z.object({
    TAM: z.string().optional(),
    SAM: z.string().optional(),
    SOM: z.string().optional(),
  }),
  metadata: z.object({
    sourceKeysUsed: z.array(z.string()),
    cached: z.boolean(),
    generatedAt: z.string(),
  }),
})

export type FreeValidationResponse = z.infer<typeof FreeValidationResponseSchema>
