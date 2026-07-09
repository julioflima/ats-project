export type SourceType = "UPLOADED" | "GENERATED";

export interface Candidate {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  sourceType: SourceType;
  createdAt: string;
}

export interface PromptTemplate {
  explanation: string;
  template: string;
}

export interface ChatAnswer {
  answer: string;
  sources: string[];
}

export interface Query {
  candidates: Candidate[];
  defaultGenerationPrompt: PromptTemplate;
}

export interface Mutation {
  uploadCandidate: Candidate;
  generateCandidate: Candidate;
  chat: ChatAnswer;
}

export interface GenerateCandidateArgs {
  prompt: string;
}

export interface ChatArgs {
  question: string;
}
