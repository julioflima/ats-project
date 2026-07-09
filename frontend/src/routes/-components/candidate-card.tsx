import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "@/graphql/graphql";

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-shadow hover:shadow-md">
      <Avatar className="h-16 w-16">
        <AvatarFallback className="text-base">{initials(candidate.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{candidate.name}</p>
        <p className="truncate text-sm text-muted-foreground">{candidate.role}</p>
      </div>
      <Badge variant={candidate.sourceType === "GENERATED" ? "secondary" : "outline"}>
        {candidate.sourceType === "GENERATED" ? "generated" : "uploaded"}
      </Badge>
    </div>
  );
}
