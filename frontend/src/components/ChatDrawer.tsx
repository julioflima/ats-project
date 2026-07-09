import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { ChatWindow } from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Chat as a lateral slide-over, opened by a floating bottom-right button
 * (chatbot-widget convention) rather than living in the main screen — the
 * candidate list (CandidatesScreen) is the primary screen now.
 */
export function ChatDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <Button
          size="fab"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-40"
        >
          <MessageCircle className="!h-6 !w-6" />
        </Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Ask about the CVs</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X />
              </Button>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <ChatWindow />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
