import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useCandidates } from "@/api";
import { CandidateCard } from "@/routes/-components/candidate-card";
import { GenerateCandidatePanel } from "@/routes/-components/generate-candidate-panel";
import { UploadCandidateDialog } from "@/routes/-components/upload-candidate-dialog";
import { Input } from "@/components/ui/input";
import type { Candidate } from "@/graphql/graphql";

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

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const renderCandidate = useCallback(
    (candidate: Candidate) => <CandidateCard key={candidate.id} candidate={candidate} />,
    [],
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
          <GenerateCandidatePanel />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading candidates...</p>}
        {isError && <p className="text-sm text-muted-foreground">Could not load candidates.</p>}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {data && data.length > 0
              ? "No candidates match your search."
              : "No candidates yet - upload a CV or generate one."}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(renderCandidate)}
        </div>
      </div>
    </div>
  );
}
