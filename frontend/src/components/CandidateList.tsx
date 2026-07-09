import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { type Candidate, useCandidates } from "@/lib/queries";

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function CandidateRow({ candidate }: { candidate: Candidate }) {
  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
      <Avatar>
        <AvatarFallback>{initials(candidate.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{candidate.name}</p>
        <p className="truncate text-xs text-muted-foreground">{candidate.role}</p>
      </div>
      <Badge variant={candidate.sourceType === "GENERATED" ? "secondary" : "outline"}>
        {candidate.sourceType === "GENERATED" ? "generated" : "uploaded"}
      </Badge>
    </li>
  );
}

export function CandidateList() {
  const { data, isLoading, isError } = useCandidates();

  if (isLoading) {
    return <p className="px-2 py-4 text-sm text-muted-foreground">Loading candidates…</p>;
  }
  if (isError) {
    return <p className="px-2 py-4 text-sm text-muted-foreground">Could not load candidates.</p>;
  }
  if (!data || data.length === 0) {
    return (
      <p className="px-2 py-4 text-sm text-muted-foreground">
        No candidates yet — upload a CV or generate one.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1 overflow-y-auto">
      {data.map((candidate) => (
        <CandidateRow key={candidate.id} candidate={candidate} />
      ))}
    </ul>
  );
}
