export function getVerifiedLogoUrl(logo?: string | null): string | undefined {
  if (!logo?.trim()) return undefined;

  try {
    const parsed = new URL(logo);
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.username || parsed.password) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}
