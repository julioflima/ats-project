import { useMemo } from "react";

import { CandidateLink } from "@/routes/-components/candidate-link";
import type { Candidate } from "@/graphql/graphql";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

interface MessageBubbleProps {
  message: ChatMessage;
  candidates?: Candidate[];
  onCandidateSelect?: (candidate: Candidate) => void;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function MessageBubble({ candidates = [], message, onCandidateSelect }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const sourceCandidates = useMemo(() => {
    if (!message.sources || candidates.length === 0) return [];

    return message.sources.map((source) => {
      const candidate = candidates.find((item) => {
        const filename = item.pdfUrl.split("/").at(-1) ?? "";
        return decodeURIComponent(filename) === source;
      });

      return { candidate, source };
    });
  }, [candidates, message.sources]);

  const linkedText = useMemo(() => {
    if (isUser || candidates.length === 0 || !onCandidateSelect) {
      return message.text;
    }

    const sortedCandidates = [...candidates].sort((a, b) => b.name.length - a.name.length);
    const pattern = new RegExp(
      `\\b(${sortedCandidates.map((candidate) => escapeRegex(candidate.name)).join("|")})\\b`,
      "g",
    );
    const pieces: Array<string | Candidate> = [];
    let lastIndex = 0;

    for (const match of message.text.matchAll(pattern)) {
      if (match.index === undefined) continue;
      if (match.index > lastIndex) {
        pieces.push(message.text.slice(lastIndex, match.index));
      }
      const candidate = sortedCandidates.find((item) => item.name === match[0]);
      if (candidate) {
        pieces.push(candidate);
      } else {
        pieces.push(match[0]);
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.text.length) {
      pieces.push(message.text.slice(lastIndex));
    }

    return pieces.length > 0 ? pieces : message.text;
  }, [candidates, isUser, message.text, onCandidateSelect]);

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap">
          {Array.isArray(linkedText)
            ? linkedText.map((piece, index) =>
                typeof piece === "string" ? (
                  <span key={`${piece}-${index}`}>{piece}</span>
                ) : (
                  <CandidateLink key={`${piece.id}-${index}`} candidate={piece} onSelect={onCandidateSelect!} />
                ),
              )
            : linkedText}
        </p>
        {message.sources && message.sources.length > 0 && (
          <p className="mt-2 border-t border-border pt-1 text-xs text-muted-foreground">
            Sources:{" "}
            {sourceCandidates.map(({ candidate, source }, index) => (
              <span key={source}>
                {candidate && onCandidateSelect ? (
                  <CandidateLink candidate={candidate} onSelect={onCandidateSelect} />
                ) : (
                  source
                )}
                {index < sourceCandidates.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
