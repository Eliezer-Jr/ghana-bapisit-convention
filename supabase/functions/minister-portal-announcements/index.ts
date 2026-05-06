import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, audience, published_at, created_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return jsonResponse({ success: true, announcements: data || [] });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
