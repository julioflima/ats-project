import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useCandidates } from "@/api";
import { CandidateListItem } from "@/routes/-components/candidate-list-item";
import { GenerateCandidatePanel } from "@/routes/-components/generate-candidate-panel";
import { PdfPreview } from "@/routes/-components/pdf-preview";
import { UploadCandidateDialog } from "@/routes/-components/upload-candidate-dialog";
import { Input } from "@/components/ui/input";
import type { Candidate } from "@/graphql/graphql";

export function CandidatesScreen() {
  const { data, isLoading, isError } = useCandidates();
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !data) return data ?? [];
    return data.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.role.toLowerCase().includes(query),
    );
  }, [data, search]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const handleShowCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  const handleGeneratedCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  const renderCandidate = useCallback(
    (candidate: Candidate) => (
      <CandidateListItem
        key={candidate.id}
        candidate={candidate}
        onShow={handleShowCandidate}
        selected={selectedCandidate?.id === candidate.id}
      />
    ),
    [handleShowCandidate, selectedCandidate?.id],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or role..."
            className="rounded-full pl-9"
            aria-label="Search candidates"
          />
        </div>
        <div className="flex gap-3">
          <UploadCandidateDialog />
          <GenerateCandidatePanel onGenerated={handleGeneratedCandidate} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="min-h-0 overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Candidates</p>
            <p className="text-xs text-muted-foreground">{filtered.length} CVs available</p>
          </div>
          <div className="max-h-full overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading candidates...</p>}
            {isError && <p className="p-4 text-sm text-muted-foreground">Could not load candidates.</p>}
            {!isLoading && !isError && filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                {data && data.length > 0
                  ? "No candidates match your search."
                  : "No candidates yet - upload a CV or generate one."}
              </p>
            )}
            {filtered.map(renderCandidate)}
          </div>
        </div>
        <PdfPreview candidate={selectedCandidate} />
      </div>
    </div>
  );
}
