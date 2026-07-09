import { Bot, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { type ChatMessage, MessageBubble } from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/lib/queries";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const chat = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || chat.isPending) return;
    setQuestion("");
    setMessages((previous) => [...previous, { role: "user", text: trimmed }]);
    try {
      const answer = await chat.mutateAsync(trimmed);
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: answer.answer, sources: answer.sources },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: `Something went wrong: ${(error as Error).message}` },
      ]);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_20%_0%,var(--muted),transparent_34%),linear-gradient(180deg,var(--background),var(--secondary))]">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-3xl border border-border/80 bg-background/80 p-5 text-center shadow-sm">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">Start with a precise question</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ask about skills, education, seniority, summaries, or comparisons across the CVs
                on file.
              </p>
              <div className="mt-4 grid gap-2 text-left text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-2">
                  Who has production Python experience?
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-2">
                  Compare the strongest frontend candidates.
                </span>
              </div>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {chat.isPending && (
          <MessageBubble message={{ role: "assistant", text: "Searching the CVs…" }} />
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-border/70 bg-background/90 p-4">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about the candidates…"
          aria-label="Question"
        />
        <Button type="submit" size="icon" disabled={chat.isPending || !question.trim()}>
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
