import { Outlet } from "@tanstack/react-router";

import { ChatSidebar } from "@/routes/-components/chat-sidebar";
import { Header } from "@/routes/-components/header";

export function AppShell() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <ChatSidebar />
      </div>
    </div>
  );
}
