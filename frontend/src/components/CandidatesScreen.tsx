import { Lightbulb, Search, Sparkles, Upload, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    if (defaultPrompt.data && prompt === "" && open) {
      setPrompt(defaultPrompt.data.template);
    }
  }, [defaultPrompt.data, open, prompt]);

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    await generate.mutateAsync(prompt);
    setOpen(false);
  };

  return (
    <>
      {!open && (
        <Button size="pill" onClick={() => setOpen(true)}>
          <Sparkles /> Generate candidate
        </Button>
      )}
      {open && (
        <section
          aria-label="Generate a synthetic candidate"
          className="fixed bottom-6 right-6 z-50 flex h-[min(760px,calc(100vh-6rem))] w-[min(720px,calc(100vw-3rem))] min-w-[380px] max-w-[calc(100vw-3rem)] resize overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-2xl shadow-black/20"
        >
          <div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_18%_0%,var(--muted),transparent_32%),linear-gradient(180deg,var(--background),var(--secondary))]">
            <header className="border-b border-border/70 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    AI CV studio
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    Generate a synthetic candidate
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Write the prompt like a hiring brief: target role, seniority, location,
                    core skills, tools, education, languages, measurable achievements, and any
                    constraints the generated CV must respect.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setOpen(false);
                    generate.reset();
                  }}
                  aria-label="Close generator"
                >
                  <X />
                </Button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  "Define the job target and seniority first.",
                  "Include evidence: metrics, projects, stack, and impact.",
                  "Avoid vague traits; ask for concrete CV sections.",
                ].map((hint) => (
                  <div
                    key={hint}
                    className="rounded-2xl border border-border/80 bg-background/80 p-4 text-sm leading-6 shadow-sm"
                  >
                    <Lightbulb className="mb-3 h-4 w-4 text-muted-foreground" />
                    {hint}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-border/80 bg-background/90 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label htmlFor="candidate-prompt" className="text-sm font-medium text-foreground">
                    Candidate prompt
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {defaultPrompt.data?.explanation ?? "Loading guidance..."}
                  </span>
                </div>
                <Textarea
                  id="candidate-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={12}
                  placeholder="Example: Generate a senior frontend engineer CV for a SaaS company. 8 years of React/TypeScript, design systems, accessibility, performance wins with measurable impact, English C1, based in Barcelona..."
                  className="min-h-[280px] resize-y rounded-2xl border-border/80 bg-secondary/50 p-4 text-base leading-7 shadow-none"
                />
              </div>

              {generate.isError && (
                <p className="mt-4 rounded-2xl border border-border bg-background p-3 text-sm text-muted-foreground">
                  Generation failed: {(generate.error as Error).message}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-background/90 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                The CV will be rendered as PDF and indexed for candidate search.
              </p>
              <Button onClick={onGenerate} size="pill" disabled={generate.isPending || !prompt.trim()}>
                {generate.isPending ? "Generating CV..." : "Generate CV"}
              </Button>
            </footer>
          </div>
        </section>
      )}
    </>
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
