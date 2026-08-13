export const MAX_INTAKE_TEXT_CHARS = 25_000;
export const MAX_INTAKE_CANDIDATES = 30;

function trimTrailingPunctuation(value: string) {
  return value.replace(/[),.!?;:\]}]+$/g, "");
}

export function extractIntakeUrls(text: string) {
  const seen = new Set<string>();
  const values = text.slice(0, MAX_INTAKE_TEXT_CHARS).match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const raw of values) {
    try {
      const parsed = new URL(trimTrailingPunctuation(raw));
      const hostname = parsed.hostname.toLowerCase();
      const privateIpv4 = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname && hostname !== "localhost" && !hostname.endsWith(".local") && !privateIpv4) {
        parsed.hash = "";
        seen.add(parsed.toString());
      }
    } catch {
      // Invalid URLs are excluded from a draft; contributors can add them manually.
    }
    if (seen.size >= MAX_INTAKE_CANDIDATES) break;
  }
  return Array.from(seen);
}

export function buildIntakeCandidates(text: string) {
  return extractIntakeUrls(text).map((url) => {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return {
      candidateType: "resource" as const,
      title: hostname,
      url,
      sourceContext: "Extracted from contributor-provided material",
      extractionMetadata: { method: "deterministic_url", version: 1 },
      confidence: "0.70",
    };
  });
}
