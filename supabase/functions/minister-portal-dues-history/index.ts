import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: payments } = await supabase
      .from("dues_payments")
      .select("*")
      .eq("minister_id", session.sub)
      .order("created_at", { ascending: false });
    const { data: settings } = await supabase
      .from("dues_settings").select("*").order("year", { ascending: false }).limit(1).maybeSingle();
    const currentYear = settings?.year ?? new Date().getFullYear();
    const paidThisYear = (payments || []).find(p => p.year === currentYear && p.status === "paid");
    return jsonResponse({
      success: true,
      payments: payments || [],
      duesSettings: settings,
      paidCurrentYear: !!paidThisYear,
    });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
