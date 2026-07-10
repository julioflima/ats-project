import { createContext, useContext } from "react";

import type { Candidate } from "@/graphql/graphql";

interface SelectedCandidateContextValue {
  selectedCandidate: Candidate | null;
  selectCandidate: (candidate: Candidate) => void;
}

export const SelectedCandidateContext = createContext<SelectedCandidateContextValue | null>(null);

export function useSelectedCandidate() {
  const value = useContext(SelectedCandidateContext);
  if (!value) {
    throw new Error("useSelectedCandidate must be used inside SelectedCandidateContext.Provider");
  }
  return value;
}
