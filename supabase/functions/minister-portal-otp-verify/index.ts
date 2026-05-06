import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, formatGhanaPhone, issuePortalToken } from "../_shared/portalAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ministerId, phoneNumber, otp } = await req.json();
    if (!ministerId || !phoneNumber || !otp) return jsonResponse({ success: false, error: "Missing fields" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const formatted = formatGhanaPhone(phoneNumber);

    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone_number", formatted)
      .eq("used", false)
      .maybeSingle();
    if (!otpRecord) return jsonResponse({ success: false, error: "No valid OTP. Request a new code." }, 400);
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("otp_codes").update({ used: true }).eq("phone_number", formatted);
      return jsonResponse({ success: false, error: "OTP expired" }, 400);
    }
    if (otpRecord.otp_code !== String(otp).trim()) {
      return jsonResponse({ success: false, error: "Invalid OTP" }, 400);
    }

    const { data: minister } = await supabase
      .from("ministers")
      .select("id, minister_id, phone, full_name")
      .eq("minister_id", ministerId.trim().toUpperCase())
      .maybeSingle();
    if (!minister) return jsonResponse({ success: false, error: "Minister not found" }, 404);

    await supabase.from("otp_codes").update({ used: true }).eq("phone_number", formatted);

    const token = await issuePortalToken({
      sub: minister.id,
      minister_id: minister.minister_id!,
      phone: formatted,
    });

    return jsonResponse({
      success: true,
      token,
      minister: { id: minister.id, minister_id: minister.minister_id, full_name: minister.full_name },
    });
  } catch (e: any) {
    console.error("portal-otp-verify error", e);
    return jsonResponse({ success: false, error: e.message }, 500);
  }
});
