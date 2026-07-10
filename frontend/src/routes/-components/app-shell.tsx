import { Outlet } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { ChatSidebar } from "@/routes/-components/chat-sidebar";
import { Header } from "@/routes/-components/header";
import { SelectedCandidateContext } from "@/routes/-components/selected-candidate-context";
import type { Candidate } from "@/graphql/graphql";

export function AppShell() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const selectCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  const selectedCandidateValue = useMemo(
    () => ({ selectedCandidate, selectCandidate }),
    [selectCandidate, selectedCandidate],
  );

  return (
    <SelectedCandidateContext.Provider value={selectedCandidateValue}>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
          <ChatSidebar />
        </div>
      </div>
    </SelectedCandidateContext.Provider>
  );
}
