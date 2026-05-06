import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Public Moolre webhook to confirm payment status. Configure this URL in Moolre dashboard.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    console.log("moolre callback:", JSON.stringify(body));
    const reference = body.externalref || body.reference || body.transactionid;
    const status = (body.status || body.txnstatus || "").toString().toLowerCase();

    if (!reference) return new Response(JSON.stringify({ success: false, error: "missing reference" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let newStatus = "pending";
    if (status === "1" || status === "success" || status === "successful" || status === "paid") newStatus = "paid";
    else if (status === "failed" || status === "0") newStatus = "failed";

    await supabase.from("dues_payments").update({
      status: newStatus,
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
      raw_payload: body,
    }).eq("provider_reference", reference);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("moolre callback error", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
  }
});
