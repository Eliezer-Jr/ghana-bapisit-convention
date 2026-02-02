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
const functionsUrl = "https://vnmwvrjuowmdvjhyuebm.supabase.co";
const functionsKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZubXd2cmp1b3dtZHZqaHl1ZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDUzMzIsImV4cCI6MjA3NjMyMTMzMn0.SG4Zc3M3rhUPSMgSQwokan4o8_4Vq1zab1IzX3nXPAo";

export const supabaseFunctions = createClient<Database>(functionsUrl, functionsKey);
