import { mutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";

import type { Mutation } from "@/graphql/graphql";

import { candidatesListKey } from "@/api/candidates/use-candidates";
import { graphqlUpload } from "@/api/client/upload";

export type TVariables = { file: File };
export type TData = Pick<Mutation, "uploadCandidate">;

const graphql = gql`
  mutation UploadCandidate($file: Upload!) {
    uploadCandidate(file: $file) {
      id
      name
      role
      avatarUrl
      sourceType
      createdAt
    }
  }
`;

export const uploadCandidateMutationOptions = mutationOptions({
  mutationFn: (variables: TVariables) => graphqlUpload<TData>(graphql, variables.file),
});

export function useUploadCandidate(
  options: Omit<typeof uploadCandidateMutationOptions, "mutationFn"> = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...uploadCandidateMutationOptions,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: candidatesListKey });
      options.onSuccess?.(...args);
    },
  });
}
