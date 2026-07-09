import { mutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";

import type { GenerateCandidateArgs, Mutation } from "@/graphql/graphql";

import { candidatesListKey } from "@/api/candidates/use-candidates";
import { client } from "@/api/client/client";

export type TVariables = GenerateCandidateArgs;
export type TData = Pick<Mutation, "generateCandidate">;

const graphql = gql`
  mutation GenerateCandidate($prompt: String!) {
    generateCandidate(prompt: $prompt) {
      id
      name
      role
      avatarUrl
      sourceType
      createdAt
    }
  }
`;

export const generateCandidateMutationOptions = mutationOptions({
  mutationFn: (variables: TVariables) => client.request<TData>(graphql, variables),
});

export function useGenerateCandidate(
  options: Omit<typeof generateCandidateMutationOptions, "mutationFn"> = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...generateCandidateMutationOptions,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: candidatesListKey });
      options.onSuccess?.(...args);
    },
  });
}
