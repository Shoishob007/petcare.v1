export type AuthUser = {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  profile_image_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  is_pet_caregiver?: boolean;
  is_veterinarian?: boolean;
  specializations?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
};

const TOKEN_KEY = "petcare_token";
const REFRESH_TOKEN_KEY = "petcare_refresh_token";
const USER_KEY = "petcare_user";
const rawConfiguredApiRoot = process.env.NEXT_PUBLIC_API_URL?.replace(
  /\/$/,
  "",
);
const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const pointsToLocalhost =
  Boolean(rawConfiguredApiRoot) &&
  /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawConfiguredApiRoot);
const AUTH_API_ROOT =
  (pointsToLocalhost && !isLocalHost ? "" : rawConfiguredApiRoot) ||
  (isLocalHost ? "http://localhost:8000" : "");

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(
  token: string,
  user: AuthUser,
  refreshToken?: string | null,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `petcare_token=${encodeURIComponent(token)}; path=/; max-age=2592000; samesite=lax`;
  window.dispatchEvent(new Event("petcare-auth-updated"));
}

export function updateAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `petcare_token=${encodeURIComponent(token)}; path=/; max-age=2592000; samesite=lax`;
  window.dispatchEvent(new Event("petcare-auth-updated"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "petcare_token=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new Event("petcare-auth-updated"));
}

export function resolveAuthImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${AUTH_API_ROOT}${url}`;
  }
  return url;
}
