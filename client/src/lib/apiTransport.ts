export function ensureJsonTrpcResponse(response: Response): Response {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) return response;

  throw new Error(
    `TRPC_NON_JSON_RESPONSE: expected application/json from /api/trpc; received ${contentType || "no content-type"} (HTTP ${response.status}).`
  );
}

export async function fetchTrpc(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await globalThis.fetch(input, {
    ...(init ?? {}),
    credentials: "include",
  });
  return ensureJsonTrpcResponse(response);
}
