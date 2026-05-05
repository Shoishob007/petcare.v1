const rawConfiguredApiRoot = process.env.NEXT_PUBLIC_API_URL?.replace(
  /\/$/,
  "",
);
const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const pointsToLocalhost =
  Boolean(rawConfiguredApiRoot) &&
  /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    rawConfiguredApiRoot || "",
  );

const API_ROOT =
  (pointsToLocalhost && !isLocalHost ? "" : rawConfiguredApiRoot) ||
  (isLocalHost ? "http://localhost:8000" : "");

export function resolveApiMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_ROOT}${url}`;
  }
  if (API_ROOT && url.startsWith("uploads/")) {
    return `${API_ROOT}/${url}`;
  }
  return url;
}
