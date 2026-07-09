import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

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
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.sources && message.sources.length > 0 && (
          <p className="mt-2 border-t border-border pt-1 text-xs text-muted-foreground">
            Sources: {message.sources.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
