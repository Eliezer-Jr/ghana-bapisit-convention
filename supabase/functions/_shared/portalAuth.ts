// Shared helpers for Minister Portal token auth.
// Issues and verifies HS256 JWTs using SUPABASE_SERVICE_ROLE_KEY as the signing secret.
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const SECRET_RAW = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "fallback-secret-change-me";

async function getKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_RAW),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface PortalSession {
  sub: string;          // ministers.id
  minister_id: string;  // GBMC-A#####
  phone: string;
  exp: number;
}

export async function issuePortalToken(payload: { sub: string; minister_id: string; phone: string }): Promise<string> {
  const key = await getKey();
  return await create(
    { alg: "HS256", typ: "JWT" },
    { ...payload, exp: getNumericDate(60 * 60 * 24 * 7) },
    key,
  );
}

export async function verifyPortalToken(token: string): Promise<PortalSession> {
  const key = await getKey();
  const payload = await verify(token, key) as unknown as PortalSession;
  return payload;
}

export async function requirePortalSession(req: Request): Promise<PortalSession> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    throw new Error("Missing portal token");
  }
  const token = auth.slice(7).trim();
  try {
    return await verifyPortalToken(token);
  } catch (_e) {
    throw new Error("Invalid or expired portal token");
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function formatGhanaPhone(phone: string): string {
  const trimmed = phone.replace(/\s+/g, "");
  if (trimmed.startsWith("+")) return trimmed.slice(1);
  if (trimmed.startsWith("233")) return trimmed;
  if (trimmed.startsWith("0")) return "233" + trimmed.slice(1);
  return trimmed;
}
