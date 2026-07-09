import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useDefaultPrompt, useGenerateCandidate } from "@/lib/queries";

/**
 * "a button to gen a candidate, after that should appear a prompt in the
 * bottom with explanation of how should be created the prompt and the prompt
 * itself" (plan-interface.md via PLAN.md section 3.3). Bottom Sheet; the
 * explanation text and default template both come from the backend — one
 * source of truth shared with the batch seeding script.
 */
export function GenerateCandidateSheet() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const defaultPrompt = useDefaultPrompt(open);
  const generate = useGenerateCandidate();

  // Pre-fill the editable textarea with the server's template once it loads.
  useEffect(() => {
    if (defaultPrompt.data && prompt === "") {
      setPrompt(defaultPrompt.data.template);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPrompt.data]);

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
        <Button variant="outline" className="w-full justify-start">
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
          <Button onClick={onGenerate} disabled={generate.isPending || !prompt.trim()}>
            {generate.isPending ? "Generating CV, rendering PDF, indexing…" : "Generate"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
