import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  getRefreshToken,
  setAuthSession,
} from "./auth";

const API_ROOTS = [
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
].filter((root, index, arr) => Boolean(root) && arr.indexOf(root) === index);

let refreshInFlight: Promise<string | null> | null = null;

type TokenRefreshResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: unknown;
};

function cloneInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: init?.headers ? new Headers(init.headers) : undefined,
  };
}

function withAccessToken(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...init, headers };
}

function hasBearerAuth(init?: RequestInit): boolean {
  if (!init?.headers) return false;
  const headers = new Headers(init.headers);
  return headers.has("Authorization");
}

async function refreshAccessToken(root: string): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    const user = getAuthUser();
    if (!refreshToken || !user) {
      clearAuthSession();
      return null;
    }

    try {
      const res = await fetch(`${root}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearAuthSession();
        return null;
      }

      const payload = (await res.json()) as TokenRefreshResponse;
      const nextUser = (payload.user as typeof user) || user;
      setAuthSession(payload.access_token, nextUser, payload.refresh_token);
      return payload.access_token;
    } catch {
      clearAuthSession();
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: Error | null = null;

  for (const root of API_ROOTS) {
    try {
      const requestInit = cloneInit(init);
      const res = await fetch(`${root}/api/v1${path}`, requestInit);
      if (res.ok) {
        return res;
      }
      if (res.status === 401 && hasBearerAuth(requestInit)) {
        const newAccessToken = await refreshAccessToken(root);
        if (newAccessToken) {
          const retried = await fetch(
            `${root}/api/v1${path}`,
            withAccessToken(cloneInit(init), newAccessToken),
          );
          if (retried.ok || retried.status < 500) {
            return retried;
          }
          lastError = new Error(`Request failed (${retried.status})`);
          continue;
        }
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
