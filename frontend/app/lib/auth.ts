export type AuthUser = {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
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
const USER_KEY = "petcare_user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
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

export function setAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `petcare_token=${encodeURIComponent(token)}; path=/; max-age=2592000; samesite=lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "petcare_token=; path=/; max-age=0; samesite=lax";
}
