import { Outlet } from "@tanstack/react-router";

import { ChatDrawer } from "@/components/ChatDrawer";
import { Header } from "@/components/Header";

export function AppShell() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <ChatDrawer />
      </div>
    </div>
  );
}
