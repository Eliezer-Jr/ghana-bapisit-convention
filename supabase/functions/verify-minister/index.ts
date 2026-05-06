import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// Public verify endpoint: GET ?id=GBMC-A00001
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || "").trim().toUpperCase();
    if (!id) return new Response(JSON.stringify({ success: false, error: "id required" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: m } = await supabase
      .from("ministers")
      .select("minister_id, full_name, photo_url, status, role, current_church_name, association, sector")
      .eq("minister_id", id)
      .maybeSingle();
    if (!m) return new Response(JSON.stringify({ success: false, error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ success: true, minister: m }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
  }
});
