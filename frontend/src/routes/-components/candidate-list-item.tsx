import { Eye } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import type { Candidate } from "@/graphql/graphql";

interface CandidateListItemProps {
  candidate: Candidate;
  onShow: (candidate: Candidate) => void;
  selected: boolean;
}

export function CandidateListItem({ candidate, onShow, selected }: CandidateListItemProps) {
  const handleShow = useCallback(() => {
    onShow(candidate);
  }, [candidate, onShow]);

  return (
    <div
      className={[
        "grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-4 py-3 transition-colors",
        selected ? "bg-muted" : "bg-background hover:bg-muted/60",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{candidate.name}</p>
        <p className="truncate text-xs text-muted-foreground">{candidate.role}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleShow}>
        <Eye />
        Show
      </Button>
    </div>
  );
}
