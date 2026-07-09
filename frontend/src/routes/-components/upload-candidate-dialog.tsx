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
  const upload = useUploadCandidate({
    onSuccess: () => setOpen(false),
  });
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
        upload.reset();
        reset();
      }
    },
    [reset, upload],
  );

  const handleUploadSubmit = useCallback(
    async (values: UploadCandidateFormValues) => {
      await upload.mutateAsync({ file: values.file[0] });
      formRef.current?.reset();
      reset();
    },
    [reset, upload],
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
          {upload.isError && (
            <p className="text-sm text-muted-foreground">
              Upload failed: {(upload.error as Error).message}
            </p>
          )}
          <Button type="submit" size="pill" disabled={upload.isPending}>
            {upload.isPending ? "Uploading & indexing..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
