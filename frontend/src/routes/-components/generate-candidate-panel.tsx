import { zodResolver } from "@hookform/resolvers/zod";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useDefaultGenerationPrompt, useGenerateCandidate } from "@/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GenerateCandidateFormValues } from "@/schemas/generate-candidate";
import { generateCandidateSchema } from "@/schemas/generate-candidate";

const promptHints = [
  "Define the job target and seniority first.",
  "Include evidence: metrics, projects, stack, and impact.",
  "Avoid vague traits; ask for concrete CV sections.",
];

export function GenerateCandidatePanel() {
  const [open, setOpen] = useState(false);
  const defaultPrompt = useDefaultGenerationPrompt({ enabled: open });
  const handleGenerateSuccess = useCallback(() => setOpen(false), []);
  const {
    error: generateError,
    isError: generateIsError,
    isPending: generateIsPending,
    mutateAsync: generateCandidate,
    reset: resetGenerate,
  } = useGenerateCandidate({ onSuccess: handleGenerateSuccess });
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<GenerateCandidateFormValues>({
    resolver: zodResolver(generateCandidateSchema),
    defaultValues: { prompt: "" },
  });
  const prompt = watch("prompt");

  useEffect(() => {
    if (defaultPrompt.data && prompt === "" && open) {
      setValue("prompt", defaultPrompt.data.template);
    }
  }, [defaultPrompt.data, open, prompt, setValue]);

  const handleOpen = useCallback(() => setOpen(true), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resetGenerate();
    reset();
  }, [reset, resetGenerate]);

  const handleGenerateSubmit = useCallback(
    async (values: GenerateCandidateFormValues) => {
      await generateCandidate({ prompt: values.prompt.trim() });
      reset();
    },
    [generateCandidate, reset],
  );

  const renderHint = useCallback(
    (hint: string) => (
      <div
        key={hint}
        className="rounded-2xl border border-border/80 bg-background/80 p-4 text-sm leading-6 shadow-sm"
      >
        <Lightbulb className="mb-3 h-4 w-4 text-muted-foreground" />
        {hint}
      </div>
    ),
    [],
  );

  return (
    <>
      {!open && (
        <Button size="pill" onClick={handleOpen}>
          <Sparkles /> Generate candidate
        </Button>
      )}
      {open && (
        <section
          aria-label="Generate a synthetic candidate"
          className="fixed bottom-6 right-6 z-50 flex h-[min(760px,calc(100vh-6rem))] w-[min(720px,calc(100vw-3rem))] min-w-[380px] max-w-[calc(100vw-3rem)] resize overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-2xl shadow-black/20"
        >
          <form
            onSubmit={handleSubmit(handleGenerateSubmit)}
            className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_18%_0%,var(--muted),transparent_32%),linear-gradient(180deg,var(--background),var(--secondary))]"
          >
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
                <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close generator">
                  <X />
                </Button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="grid gap-3 md:grid-cols-3">{promptHints.map(renderHint)}</div>

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
                  rows={12}
                  placeholder="Example: Generate a senior frontend engineer CV for a SaaS company. 8 years of React/TypeScript, design systems, accessibility, performance wins with measurable impact, English C1, based in Barcelona..."
                  className="min-h-[280px] resize-y rounded-2xl border-border/80 bg-secondary/50 p-4 text-base leading-7 shadow-none"
                  {...register("prompt")}
                />
                {errors.prompt?.message && (
                  <p className="mt-2 text-xs text-destructive">{errors.prompt.message}</p>
                )}
              </div>

              {generateIsError && (
                <p className="mt-4 rounded-2xl border border-border bg-background p-3 text-sm text-muted-foreground">
                  Generation failed: {(generateError as Error).message}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-border/70 bg-background/90 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                The CV will be rendered as PDF and indexed for candidate search.
              </p>
              <Button type="submit" size="pill" disabled={generateIsPending}>
                {generateIsPending ? "Generating CV..." : "Generate CV"}
              </Button>
            </footer>
          </form>
        </section>
      )}
    </>
  );
}
