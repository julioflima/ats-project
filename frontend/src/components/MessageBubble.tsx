import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-muted text-foreground",
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
