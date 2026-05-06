// Helper to call Minister Portal edge functions with the portal JWT.
const FN_BASE = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_FUNCTIONS_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const PORTAL_TOKEN_KEY = "minister_portal_token";
export const PORTAL_MINISTER_KEY = "minister_portal_minister";

export interface PortalMinister {
  id: string;
  minister_id: string;
  full_name: string;
}

export function getPortalToken(): string | null {
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function getPortalMinister(): PortalMinister | null {
  const v = localStorage.getItem(PORTAL_MINISTER_KEY);
  return v ? JSON.parse(v) : null;
}

export function clearPortalSession() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_MINISTER_KEY);
}

export async function portalFetch<T = any>(fn: string, opts: { method?: string; body?: any; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON,
  };
  if (opts.auth !== false) {
    const t = getPortalToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  } else {
    headers.Authorization = `Bearer ${ANON}`;
  }
  const res = await fetch(`${FN_BASE}/${fn}`, {
    method: opts.method || (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request to ${fn} failed`);
  }
  return data as T;
}
