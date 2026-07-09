import { GraphQLClient } from "graphql-request";

// Relative URL: the vite dev server proxies /graphql to the backend, and the
// Caddy image does the same in docker-compose/k3s — no per-env config needed.
export const graphqlClient = new GraphQLClient("/graphql");

/**
 * File upload via the GraphQL multipart request spec — hand-rolled FormData
 * rather than a client library, mirroring the server-side Upload scalar
 * choice (PLAN.md section 3.2: the one genuinely fiddly part of GraphQL here).
 */
export async function graphqlUpload<T>(
  query: string,
  file: File,
  fileVariableName = "file",
): Promise<T> {
  const form = new FormData();
  form.append("operations", JSON.stringify({ query, variables: { [fileVariableName]: null } }));
  form.append("map", JSON.stringify({ "0": [`variables.${fileVariableName}`] }));
  form.append("0", file);

  const response = await fetch("/graphql", { method: "POST", body: form });
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }
  return payload.data as T;
}
