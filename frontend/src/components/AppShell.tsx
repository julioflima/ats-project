import { Outlet } from "@tanstack/react-router";

import { ChatDrawer } from "@/components/ChatDrawer";
import { Header } from "@/components/Header";

/**
 * SaaS shell (PLAN.md section 3.3): header with logo + name; the candidate
 * list is the primary full-width screen (see CandidatesScreen, rendered by
 * the index route below); chat is a floating-button-triggered lateral
 * drawer (ChatDrawer), not a permanent pane — mounted here so it's available
 * on every route.
 */
export function AppShell() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <ChatDrawer />
    </div>
  );
}
