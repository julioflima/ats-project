import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { CandidateList } from "@/components/CandidateList";
import { GenerateCandidateSheet } from "@/components/GenerateCandidateSheet";
import { Header } from "@/components/Header";
import { UploadCandidateDialog } from "@/components/UploadCandidateDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <UploadCandidateDialog />
      <GenerateCandidateSheet />
      <p className="mt-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Candidates
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CandidateList />
      </div>
    </div>
  );
}

/**
 * SaaS shell (PLAN.md section 3.3): header with logo + name, responsive
 * two-pane body. Below the md breakpoint the sidebar collapses into a
 * drawer opened from the header's menu button.
 */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <Header onOpenSidebar={() => setDrawerOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-border md:block">
          <SidebarContent />
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b border-border p-3">
            <SheetTitle className="text-sm">Candidates</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}
