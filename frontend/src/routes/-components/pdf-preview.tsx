import type { Candidate } from "@/graphql/graphql";

interface PdfPreviewProps {
  candidate: Candidate | null;
}

export function PdfPreview({ candidate }: PdfPreviewProps) {
  if (!candidate) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40 p-8 text-center">
        <div>
          <p className="text-sm font-medium text-foreground">No CV selected</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Click Show on a candidate to preview the original PDF here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <p className="truncate text-sm font-semibold text-foreground">{candidate.name}</p>
        <p className="truncate text-xs text-muted-foreground">{candidate.role}</p>
      </header>
      <iframe
        title={`${candidate.name} CV`}
        src={candidate.pdfUrl}
        className="min-h-0 flex-1 bg-muted"
      />
    </section>
  );
}
