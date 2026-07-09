import { Grip, MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChatWindow } from "@/routes/-components/chat-window";

export function ChatSidebar() {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const maxWidth = Math.max(380, window.innerWidth - 360);
      const nextWidth = Math.min(Math.max(window.innerWidth - event.clientX, 360), maxWidth);
      setWidth(nextWidth);
    };

    const handlePointerUp = () => setIsResizing(false);

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing]);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleResizeStart = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  return (
    <>
      {!open && (
        <Button
          size="fab"
          onClick={handleOpen}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-40"
        >
          <MessageCircle className="!h-6 !w-6" />
        </Button>
      )}
      {open && (
        <aside
          aria-label="Ask about the CVs"
          className="relative flex h-full max-w-[calc(100vw-360px)] shrink-0 border-l border-border/80 bg-background/95 shadow-2xl shadow-black/10 backdrop-blur"
          style={{ width }}
        >
          <button
            type="button"
            className="absolute left-0 top-1/2 z-10 flex h-24 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-border bg-foreground text-background shadow-xl transition-transform hover:scale-105"
            onPointerDown={handleResizeStart}
            aria-label="Resize chat drawer"
          >
            <Grip className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <header className="flex items-start justify-between gap-4 border-b border-border/70 bg-gradient-to-br from-background via-muted/60 to-background px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  CV intelligence
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  Ask about the CVs
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close chat">
                <X />
              </Button>
            </header>
            <div className="min-h-0 flex-1">
              <ChatWindow />
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
