import { Search, Sparkles, Upload } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { CandidateCard } from "@/components/CandidateCard";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useDefaultPrompt, useGenerateCandidate, useUploadCandidate } from "@/lib/queries";
import { useCandidates } from "@/lib/queries";

function UploadButton() {
  const [open, setOpen] = useState(false);
  const upload = useUploadCandidate();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
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
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input name="file" type="file" accept="application/pdf" required />
          {upload.isError && (
            <p className="text-sm text-muted-foreground">
              Upload failed: {(upload.error as Error).message}
            </p>
          )}
          <Button type="submit" size="pill" disabled={upload.isPending}>
            {upload.isPending ? "Uploading & indexing…" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GenerateButton() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const defaultPrompt = useDefaultPrompt(open);
  const generate = useGenerateCandidate();

  if (defaultPrompt.data && prompt === "" && open) {
    // Pre-fill once, right when the sheet opens with data available.
    setPrompt(defaultPrompt.data.template);
  }

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    await generate.mutateAsync(prompt);
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) generate.reset();
      }}
    >
      <SheetTrigger asChild>
        <Button size="pill">
          <Sparkles /> Generate candidate
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-3xl">
        <SheetHeader>
          <SheetTitle>Generate a synthetic candidate</SheetTitle>
          <SheetDescription>
            {defaultPrompt.data?.explanation ?? "Loading guidance…"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            placeholder="Describe the candidate to generate…"
          />
          {generate.isError && (
            <p className="text-sm text-muted-foreground">
              Generation failed: {(generate.error as Error).message}
            </p>
          )}
          <Button onClick={onGenerate} size="pill" disabled={generate.isPending || !prompt.trim()}>
            {generate.isPending ? "Generating CV, rendering PDF, indexing…" : "Generate"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The primary screen (PLAN.md section 3.3): a search-and-actions toolbar on
 * top, the candidate list as a card grid below. Upload/Generate are the
 * prominent, rounded, black actions; search filters client-side over the
 * already-loaded list by name or role.
 */
export function CandidatesScreen() {
  const { data, isLoading, isError } = useCandidates();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !data) return data ?? [];
    return data.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query),
    );
  }, [data, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or role…"
            className="rounded-full pl-9"
            aria-label="Search candidates"
          />
        </div>
        <div className="flex gap-3">
          <UploadButton />
          <GenerateButton />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading candidates…</p>}
        {isError && <p className="text-sm text-muted-foreground">Could not load candidates.</p>}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {data && data.length > 0
              ? "No candidates match your search."
              : "No candidates yet — upload a CV or generate one."}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </div>
    </div>
  );
}
