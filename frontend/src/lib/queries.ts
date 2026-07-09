import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";

import { graphqlClient, graphqlUpload } from "@/lib/graphql-client";

export interface Candidate {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  sourceType: "UPLOADED" | "GENERATED";
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

const CANDIDATES_QUERY = gql`
  query Candidates {
    candidates {
      id
      name
      role
      avatarUrl
      sourceType
      createdAt
    }
  }
`;

const DEFAULT_PROMPT_QUERY = gql`
  query DefaultGenerationPrompt {
    defaultGenerationPrompt {
      explanation
      template
    }
  }
`;

const UPLOAD_MUTATION = gql`
  mutation UploadCandidate($file: Upload!) {
    uploadCandidate(file: $file) {
      id
      name
      role
    }
  }
`;

const GENERATE_MUTATION = gql`
  mutation GenerateCandidate($prompt: String!) {
    generateCandidate(prompt: $prompt) {
      id
      name
      role
    }
  }
`;

const CHAT_MUTATION = gql`
  mutation Chat($question: String!) {
    chat(question: $question) {
      answer
      sources
    }
  }
`;

export function useCandidates() {
  return useQuery({
    queryKey: ["candidates"],
    queryFn: async () =>
      (await graphqlClient.request<{ candidates: Candidate[] }>(CANDIDATES_QUERY)).candidates,
  });
}

export function useDefaultPrompt(enabled: boolean) {
  return useQuery({
    queryKey: ["defaultGenerationPrompt"],
    queryFn: async () =>
      (
        await graphqlClient.request<{ defaultGenerationPrompt: PromptTemplate }>(
          DEFAULT_PROMPT_QUERY,
        )
      ).defaultGenerationPrompt,
    enabled,
    staleTime: Infinity,
  });
}

export function useUploadCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      graphqlUpload<{ uploadCandidate: Candidate }>(UPLOAD_MUTATION, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useGenerateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) =>
      graphqlClient.request<{ generateCandidate: Candidate }>(GENERATE_MUTATION, { prompt }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useChat() {
  return useMutation({
    mutationFn: async (question: string) =>
      (await graphqlClient.request<{ chat: ChatAnswer }>(CHAT_MUTATION, { question })).chat,
  });
}
