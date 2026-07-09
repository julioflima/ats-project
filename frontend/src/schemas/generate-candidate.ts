import { z } from "zod";

export const generateCandidateSchema = z.object({
  prompt: z.string().trim().min(1, "Describe the candidate to generate."),
});

export type GenerateCandidateFormValues = z.infer<typeof generateCandidateSchema>;
