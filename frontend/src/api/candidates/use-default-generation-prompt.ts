import { queryOptions, useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";

import type { Query } from "@/graphql/graphql";

import { client } from "@/api/client/client";
import { candidatesKey } from "@/api/candidates/key";

export type TVariables = { enabled: boolean };
export type TData = Query["defaultGenerationPrompt"];

export const defaultGenerationPromptKey = [
  ...candidatesKey,
  "default-generation-prompt",
] as const;

const graphql = gql`
  query DefaultGenerationPrompt {
    defaultGenerationPrompt {
      explanation
      template
    }
  }
`;

export const defaultGenerationPromptQueryOptions = (variables: TVariables) =>
  queryOptions({
    queryKey: defaultGenerationPromptKey,
    queryFn: async () =>
      (await client.request<Pick<Query, "defaultGenerationPrompt">>(graphql))
        .defaultGenerationPrompt,
    enabled: variables.enabled,
    staleTime: Infinity,
  });

export const useDefaultGenerationPrompt = (
  variables: TVariables,
  options: Omit<ReturnType<typeof defaultGenerationPromptQueryOptions>, "queryKey" | "queryFn"> = {},
) => useQuery({ ...defaultGenerationPromptQueryOptions(variables), ...options });
