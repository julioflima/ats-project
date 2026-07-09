import { z } from "zod";

export const uploadCandidateSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, "Choose one PDF file.")
    .refine((files) => files[0]?.type === "application/pdf", "Only PDF files are supported."),
});

export type UploadCandidateFormValues = z.infer<typeof uploadCandidateSchema>;
