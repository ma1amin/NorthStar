export function shouldServeStaticClient(environment: string | undefined, staticPreview: string | undefined) {
  return environment !== "development" || staticPreview === "true";
}
