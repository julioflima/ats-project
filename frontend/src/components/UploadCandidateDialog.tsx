import { Upload } from "lucide-react";
import { useRef, useState } from "react";

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
import { useUploadCandidate } from "@/lib/queries";

export function UploadCandidateDialog() {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadCandidate();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    await upload.mutateAsync(file);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) upload.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Upload /> Upload candidate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a candidate CV</DialogTitle>
          <DialogDescription>
            PDF only. The CV is parsed, indexed for chat, and added to the candidate list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input ref={fileInputRef} type="file" accept="application/pdf" required />
          {upload.isError && (
            <p className="text-sm text-muted-foreground">
              Upload failed: {(upload.error as Error).message}
            </p>
          )}
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending ? "Uploading & indexing…" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
