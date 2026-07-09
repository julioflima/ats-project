import { mutationOptions, useMutation } from "@tanstack/react-query";
import { gql } from "graphql-request";

import type { ChatArgs, Mutation } from "@/graphql/graphql";

import { client } from "@/api/client/client";

export type TVariables = ChatArgs;
export type TData = Mutation["chat"];

const graphql = gql`
  mutation Chat($question: String!) {
    chat(question: $question) {
      answer
      sources
    }
  }
`;

export const chatMutationOptions = mutationOptions({
  mutationFn: async (variables: TVariables) =>
    (await client.request<Pick<Mutation, "chat">>(graphql, variables)).chat,
});

export const useChat = (options: Omit<typeof chatMutationOptions, "mutationFn"> = {}) =>
  useMutation({ ...chatMutationOptions, ...options });
