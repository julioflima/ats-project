import { queryOptions, useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";

import type { Query } from "@/graphql/graphql";

import { client } from "@/api/client/client";
import { candidatesKey } from "@/api/candidates/key";

export type TVariables = void;
export type TData = Query["candidates"];

export const candidatesListKey = [...candidatesKey, "list"] as const;

const graphql = gql`
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

export const candidatesQueryOptions = queryOptions({
  queryKey: candidatesListKey,
  queryFn: async () => (await client.request<Pick<Query, "candidates">>(graphql)).candidates,
});

export const useCandidates = (
  options: Omit<typeof candidatesQueryOptions, "queryKey" | "queryFn"> = {},
) => useQuery({ ...candidatesQueryOptions, ...options });
