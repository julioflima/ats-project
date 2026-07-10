import { useCallback } from "react";

import type { Candidate } from "@/graphql/graphql";

interface CandidateLinkProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
}

export function CandidateLink({ candidate, onSelect }: CandidateLinkProps) {
  const handleClick = useCallback(() => {
    onSelect(candidate);
  }, [candidate, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline cursor-pointer font-semibold underline decoration-foreground/40 underline-offset-4 transition hover:decoration-foreground"
    >
      {candidate.name}
    </button>
  );
}
