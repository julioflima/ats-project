import { z } from "zod";

export const chatQuestionSchema = z.object({
  question: z.string().trim().min(1, "Ask a question about the CVs."),
});

export type ChatQuestionFormValues = z.infer<typeof chatQuestionSchema>;
