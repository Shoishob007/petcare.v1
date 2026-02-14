const API_ROOTS = [
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
].filter((root, index, arr) => Boolean(root) && arr.indexOf(root) === index);

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: Error | null = null;

  for (const root of API_ROOTS) {
    try {
      const res = await fetch(`${root}/api/v1${path}`, init);
      if (res.ok) {
        return res;
      }
      if (res.status >= 500) {
        lastError = new Error(`Request failed (${res.status})`);
        continue;
      }
      return res;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Network request failed");
    }
  }

  throw lastError || new Error("Unable to reach backend API");
}
