import { z } from "zod"

const LongReportSchema = z.object({
  text: z.string().min(0), // enforcement of >=300 words happens in pipeline
  positives: z.array(z.string()).default([]),
  negatives: z.array(z.string()).default([]),
})

export const FreeValidationResponseSchema = z.object({
  classification: z.enum(["high", "possible", "low", "joke"]),
  score: z.number().min(0).max(10),
  summary: z.string(),
  // Optional long-form YC-partner-style memo for richer free reports.
  longReport: LongReportSchema.optional(),
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
    confidence: z.enum(["low", "medium", "high"]).optional(),
    assumptions: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    sourceKeysUsed: z.array(z.string()),
    cached: z.boolean(),
    generatedAt: z.string(),
    // Evidence & quality guards
    kgEvidenceIds: z.array(z.string()).optional(),
    dataFreshnessWarning: z.string().nullable().optional(),
    needsReview: z.boolean().optional(),
    needsReviewReason: z.string().nullable().optional(),
  }),
})

export type FreeValidationResponse = z.infer<typeof FreeValidationResponseSchema>
