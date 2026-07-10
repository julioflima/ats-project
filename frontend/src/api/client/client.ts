import { GraphQLClient } from "graphql-request";

const graphqlEndpoint = new URL("/graphql", window.location.origin).toString();

export const client = new GraphQLClient(graphqlEndpoint);
