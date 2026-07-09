export async function graphqlUpload<TData>(
  query: string,
  file: File,
  fileVariableName = "file",
): Promise<TData> {
  const form = new FormData();
  form.append("operations", JSON.stringify({ query, variables: { [fileVariableName]: null } }));
  form.append("map", JSON.stringify({ "0": [`variables.${fileVariableName}`] }));
  form.append("0", file);

  const response = await fetch("/graphql", { method: "POST", body: form });
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }
  return payload.data as TData;
}
