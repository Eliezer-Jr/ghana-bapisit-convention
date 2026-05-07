import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: minister } = await supabase
      .from("ministers")
      .select("sector, association")
      .eq("id", session.sub)
      .maybeSingle();

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, audience, audience_value, published_at, created_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });
    if (error) throw error;

    const sector = minister?.sector || null;
    const association = minister?.association || null;

    const filtered = (data || []).filter((a: any) => {
      if (a.audience === "all" || !a.audience) return true;
      if (a.audience === "sector") return a.audience_value && a.audience_value === sector;
      if (a.audience === "association") return a.audience_value && a.audience_value === association;
      return false;
    });

    return jsonResponse({ success: true, announcements: filtered });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
