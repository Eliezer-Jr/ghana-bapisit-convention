import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";

async function withSignedDocumentUrls(supabase: any, rows: any[]) {
  return Promise.all((rows || []).map(async (row) => {
    if (!row.document_url || row.document_url.startsWith("http")) return row;

    const { data } = await supabase.storage
      .from("application-documents")
      .createSignedUrl(row.document_url, 3600);

    return {
      ...row,
      document_preview_url: data?.signedUrl || null,
    };
  }));
}

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

    const qualifications = await withSignedDocumentUrls(supabase, quals || []);

    return jsonResponse({
      success: true,
      minister,
      qualifications,
      latestPayment,
      pendingDocs: pendingDocs || [],
      duesSettings: settings,
    });
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
