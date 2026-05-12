import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Manage the minister's educational_qualifications.
// GET                                  -> list
// POST { action: "upsert", item: { qualification, institution, year_obtained, fileName?, mimeType?, base64? } }
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (req.method === "GET") {
      const { data } = await supabase.from("educational_qualifications").select("*").eq("minister_id", session.sub).order("year_obtained", { ascending: false });
      return jsonResponse({ success: true, qualifications: data || [] });
    }

    const body = await req.json();

    if (body.action === "delete") return jsonResponse({ success: false, error: "Existing records cannot be edited from the portal" }, 403);

    if (body.action === "upsert") {
      const item = body.item || {};
      if (item.id) return jsonResponse({ success: false, error: "Existing records cannot be edited from the portal" }, 403);

      const qualification = (item.qualification || "").trim();
      if (!qualification) return jsonResponse({ success: false, error: "Qualification is required" }, 400);

      const update: any = {
        qualification,
        institution: item.institution || null,
        year_obtained: item.year_obtained ? Number(item.year_obtained) : null,
      };

      // Optional file attach
      if (item.base64 && item.fileName) {
        const path = `minister-uploads/${session.sub}/qualifications/${Date.now()}-${item.fileName}`;
        const bytes = decodeBase64(item.base64);
        const { error: upErr } = await supabase.storage.from("application-documents").upload(path, bytes, {
          contentType: item.mimeType || "application/octet-stream",
          upsert: false,
        });
        if (upErr) throw upErr;
        update.document_url = path;
        update.document_name = item.fileName;
        update.document_type = item.mimeType || null;
      }

      const { data, error } = await supabase.from("educational_qualifications").insert({ ...update, minister_id: session.sub }).select("id").maybeSingle();
      if (error) throw error;
      return jsonResponse({ success: true, id: data?.id });
    }

    return jsonResponse({ success: false, error: "Unknown action" }, 400);
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
