import { SendHorizontal } from "lucide-react";
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
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-md text-center text-sm text-muted-foreground">
              Ask anything about the CVs on file — e.g. “Who has experience with Python?”,
              “Which candidate graduated from UPC?”, or “Summarize the profile of Jane Doe.”
            </p>
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
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-border p-4">
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
