import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: minister }, { data: quals }, { data: latestPayment }, { data: pendingDocs }, { data: settings }] = await Promise.all([
      supabase.from("ministers").select("*").eq("id", session.sub).maybeSingle(),
      supabase.from("educational_qualifications").select("*").eq("minister_id", session.sub),
      supabase.from("dues_payments").select("*").eq("minister_id", session.sub).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("document_requests").select("*").eq("minister_id", session.sub).in("status", ["pending", "rejected"]),
      supabase.from("dues_settings").select("*").order("year", { ascending: false }).limit(1).maybeSingle(),
    ]);

    return jsonResponse({
      success: true,
      minister,
      qualifications: quals || [],
      latestPayment,
      pendingDocs: pendingDocs || [],
      duesSettings: settings,
    });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
