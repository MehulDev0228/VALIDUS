import { z } from "zod"

export const IdeaInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  industry: z.string().optional(),
  targetMarket: z.string().optional(),
  revenueModel: z.string().optional(),
  keyFeatures: z.array(z.string()).optional(),
  useMode: z.enum(["free", "client-byo", "server-proxy"]).default("free"),
})

export type IdeaInput = z.infer<typeof IdeaInputSchema>
