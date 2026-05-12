import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";

// POST { section: "education" | "profile", notes?: string }
// Creates a document_request row flagged as a self-submitted review request
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const section = body.section || "education";
    const labelMap: Record<string, string> = {
      education: "Educational Information Review",
      profile: "Profile Review",
    };
    const title = labelMap[section] || "Data Review";

    // Avoid duplicate open request for the same section
    const { data: existing } = await supabase
      .from("document_requests")
      .select("id, status")
      .eq("minister_id", session.sub)
      .eq("title", title)
      .in("status", ["pending", "submitted"])
      .maybeSingle();
    if (existing) {
      return jsonResponse({ success: true, alreadyOpen: true, requestId: existing.id });
    }

    const { data, error } = await supabase.from("document_requests").insert({
      minister_id: session.sub,
      title,
      description: `Self-submitted by minister for review. Section: ${section}.${body.notes ? "\nNotes: " + body.notes : ""}`,
      status: "submitted",
    }).select("id").maybeSingle();
    if (error) throw error;

    return jsonResponse({ success: true, requestId: data?.id });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
