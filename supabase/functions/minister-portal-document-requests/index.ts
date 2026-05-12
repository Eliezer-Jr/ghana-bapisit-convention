import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession } from "../_shared/portalAuth.ts";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

async function withSignedUploadUrls(supabase: any, rows: any[]) {
  return Promise.all((rows || []).map(async (row) => {
    if (!row.file_url || row.file_url.startsWith("http")) return row;

    const { data } = await supabase.storage
      .from("application-documents")
      .createSignedUrl(row.file_url, 3600);

    return {
      ...row,
      file_preview_url: data?.signedUrl || null,
    };
  }));
}

// Actions:
// GET ?  -> list requests + uploads for current minister
// POST { action: "upload", requestId, fileName, mimeType, base64 } -> upload + mark submitted
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (req.method === "GET") {
      const { data: requests } = await supabase
        .from("document_requests")
        .select("*")
        .eq("minister_id", session.sub)
        .order("created_at", { ascending: false });
      const ids = (requests || []).map(r => r.id);
      const { data: uploads } = ids.length
        ? await supabase.from("document_request_uploads").select("*").in("request_id", ids)
        : { data: [] as any[] };
      const signedUploads = await withSignedUploadUrls(supabase, uploads || []);
      return jsonResponse({ success: true, requests: requests || [], uploads: signedUploads });
    }

    const body = await req.json();
    if (body.action === "upload") {
      const { requestId, fileName, mimeType, base64 } = body;
      if (!requestId || !fileName || !base64) return jsonResponse({ success: false, error: "Missing fields" }, 400);

      // Verify the request belongs to this minister
      const { data: dr } = await supabase.from("document_requests").select("id, minister_id").eq("id", requestId).maybeSingle();
      if (!dr || dr.minister_id !== session.sub) return jsonResponse({ success: false, error: "Not allowed" }, 403);

      const path = `minister-uploads/${session.sub}/${requestId}/${Date.now()}-${fileName}`;
      const bytes = decodeBase64(base64);
      const { error: upErr } = await supabase.storage.from("application-documents").upload(path, bytes, {
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      });
      if (upErr) throw upErr;

      await supabase.from("document_request_uploads").insert({
        request_id: requestId,
        file_url: path,
        file_name: fileName,
        mime_type: mimeType,
      });
      await supabase.from("document_requests").update({ status: "submitted", updated_at: new Date().toISOString() }).eq("id", requestId);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: "Unknown action" }, 400);
  } catch (e: any) {
    return jsonResponse({ success: false, error: e.message }, 401);
  }
});
