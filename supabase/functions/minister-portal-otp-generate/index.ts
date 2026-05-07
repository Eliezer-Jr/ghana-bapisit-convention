import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, formatGhanaPhone } from "../_shared/portalAuth.ts";

const FROG_SMS_URL = "https://frogapi.wigal.com.gh/api/v3/sms/send";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ministerId, phoneNumber } = await req.json();
    if (!ministerId || !phoneNumber) return jsonResponse({ success: false, error: "Minister ID and phone are required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Look up minister; phone match (allow both 0xxx and 233xxx forms)
    const formatted = formatGhanaPhone(phoneNumber);
    const local0 = formatted.startsWith("233") ? "0" + formatted.slice(3) : formatted;

    const { data: minister, error } = await supabase
      .from("ministers")
      .select("id, minister_id, phone, full_name")
      .eq("minister_id", ministerId.trim().toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (!minister) return jsonResponse({ success: false, error: "Minister ID not found" }, 404);

    const rawMinisterPhone = (minister.phone || "").replace(/\s+/g, "").replace(/^\+/, "");
    const ministerLocal0 = rawMinisterPhone.startsWith("233") ? "0" + rawMinisterPhone.slice(3) : rawMinisterPhone;
    if (rawMinisterPhone !== formatted && ministerLocal0 !== local0 && rawMinisterPhone !== local0 && ministerLocal0 !== formatted) {
      return jsonResponse({ success: false, error: "Phone number does not match our records for this Minister ID" }, 403);
    }

    const apiKey = Deno.env.get("FROGAPI_KEY");
    const username = Deno.env.get("FROGAPI_USERNAME");
    const senderId = Deno.env.get("FROGAPI_OTP_SENDER_ID") || "GBCC";
    if (!apiKey || !username) return jsonResponse({ success: false, error: "SMS provider not configured" }, 500);

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const message = `Your GBCC Minister Portal verification code is: ${otpCode}. It will expire in 5 minutes.`;

    const smsRes = await fetch(FROG_SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "API-KEY": apiKey, "USERNAME": username },
      body: JSON.stringify({
        senderid: senderId,
        destinations: [{ destination: formatted, msgid: `mp-otp-${formatted}-${Date.now()}` }],
        message,
        smstype: "text",
      }),
    });
    const smsText = await smsRes.text();
    let smsData: any;
    try { smsData = JSON.parse(smsText); } catch { smsData = { raw: smsText }; }
    const okStatus = ["ACCEPTD", "ACCEPTED", "SUCCESS"].includes(String(smsData?.status ?? "").toUpperCase());
    if (!smsRes.ok || !okStatus) {
      return jsonResponse({ success: false, error: `SMS delivery failed: ${smsData?.message || smsText.substring(0, 200)}` });
    }

    await supabase.from("otp_codes").upsert({
      phone_number: formatted,
      otp_code: otpCode,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      used: false,
    }, { onConflict: "phone_number" });

    return jsonResponse({ success: true });
  } catch (e: any) {
    console.error("portal-otp-generate error", e);
    return jsonResponse({ success: false, error: e.message }, 500);
  }
});
