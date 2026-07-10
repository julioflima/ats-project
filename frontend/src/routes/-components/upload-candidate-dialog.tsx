import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useUploadCandidate } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { UploadCandidateFormValues } from "@/schemas/upload-candidate";
import { uploadCandidateSchema } from "@/schemas/upload-candidate";

export function UploadCandidateDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const handleUploadSuccess = useCallback(() => setOpen(false), []);
  const {
    error: uploadError,
    isError: uploadIsError,
    isPending: uploadIsPending,
    mutateAsync: uploadCandidate,
    reset: resetUpload,
  } = useUploadCandidate({ onSuccess: handleUploadSuccess });
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<UploadCandidateFormValues>({
    resolver: zodResolver(uploadCandidateSchema),
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetUpload();
        reset();
      }
    },
    [reset, resetUpload],
  );

  const handleUploadSubmit = useCallback(
    async (values: UploadCandidateFormValues) => {
      await uploadCandidate({ file: values.file[0] });
      formRef.current?.reset();
      reset();
    },
    [reset, uploadCandidate],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="pill" variant="outline">
          <Upload /> Upload candidate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a candidate CV</DialogTitle>
          <DialogDescription>
            PDF only. The CV is parsed, indexed for chat, and added to the list.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit(handleUploadSubmit)} className="flex flex-col gap-4">
          <Input type="file" accept="application/pdf" {...register("file")} />
          {errors.file?.message && (
            <p className="text-xs text-destructive">{errors.file.message}</p>
          )}
          {uploadIsError && (
            <p className="text-sm text-muted-foreground">
              Upload failed: {(uploadError as Error).message}
            </p>
          )}
          <Button type="submit" size="pill" disabled={uploadIsPending}>
            {uploadIsPending ? "Uploading & indexing..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
