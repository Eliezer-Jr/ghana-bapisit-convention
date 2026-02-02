import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Self-hosted Supabase - Database, Auth, Storage
const supabaseUrl = "http://supabase.ghanabaptistministers.com";
const supabaseKey = import.meta.env.VITE_SUPABASE_DB_KEY;

export const supabaseDB = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Lovable Cloud - Edge Functions & Secrets
const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL;
const functionsKey = import.meta.env.VITE_SUPABASE_FUNCTIONS_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseFunctions = createClient<Database>(functionsUrl, functionsKey);
