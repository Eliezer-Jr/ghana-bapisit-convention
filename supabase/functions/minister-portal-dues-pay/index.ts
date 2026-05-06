import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, jsonResponse, requirePortalSession, formatGhanaPhone } from "../_shared/portalAuth.ts";

// Initiates a Moolre Mobile Money charge for the current year's dues.
// NOTE: Moolre charge endpoint specifics may vary by account; this implementation
// inserts a pending payment row and calls Moolre's payin endpoint. If MOOLRE_ACCOUNT_NUMBER
// is missing, the call will fail and the row remains pending for manual reconciliation.

const MOOLRE_PAYIN_URL = "https://api.moolre.com/open/transact/payment";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const session = await requirePortalSession(req);
    const body = await req.json().catch(() => ({}));
    const phoneOverride = body.phone ? formatGhanaPhone(body.phone) : session.phone;
    const channel = body.channel || "MTN"; // MTN, VODAFONE, AIRTELTIGO

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: settings } = await supabase
      .from("dues_settings").select("*").order("year", { ascending: false }).limit(1).maybeSingle();
    if (!settings) return jsonResponse({ success: false, error: "Annual dues amount not set yet" }, 400);

    // Check if already paid this year
    const { data: existingPaid } = await supabase
      .from("dues_payments").select("id").eq("minister_id", session.sub).eq("year", settings.year).eq("status", "paid").maybeSingle();
    if (existingPaid) return jsonResponse({ success: false, error: "Dues already paid for this year" }, 400);

    const reference = `DUES-${settings.year}-${session.minister_id}-${Date.now()}`;

    const { data: paymentRow, error: insErr } = await supabase.from("dues_payments").insert({
      minister_id: session.sub,
      year: settings.year,
      amount: settings.amount,
      currency: settings.currency,
      status: "pending",
      provider: "moolre",
      provider_reference: reference,
      phone: phoneOverride,
    }).select().single();
    if (insErr) throw insErr;

    const apiUser = Deno.env.get("MOOLRE_API_USER") || Deno.env.get("FROGAPI_USERNAME");
    const apiKey = Deno.env.get("MOOLRE_API_KEY") || Deno.env.get("MOOLRE_API_VASKEY");
    const accountNumber = Deno.env.get("MOOLRE_ACCOUNT_NUMBER");

    if (!accountNumber) {
      return jsonResponse({
        success: true,
        pending: true,
        message: "Payment recorded. Please complete Mobile Money payment manually; finance will confirm.",
        reference,
        paymentId: paymentRow.id,
      });
    }

    const moolreBody = {
      type: 1, // payin
      channel,
      currency: settings.currency,
      amount: Number(settings.amount).toFixed(2),
      reference,
      accountnumber: accountNumber,
      externalref: reference,
      payer: phoneOverride,
    };

    const res = await fetch(MOOLRE_PAYIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiUser ? { "X-API-USER": apiUser } : {}),
        ...(apiKey ? { "X-API-KEY": apiKey } : {}),
      },
      body: JSON.stringify(moolreBody),
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    await supabase.from("dues_payments").update({ raw_payload: data }).eq("id", paymentRow.id);

    if (!res.ok || data.status === 0) {
      await supabase.from("dues_payments").update({ status: "failed" }).eq("id", paymentRow.id);
      return jsonResponse({ success: false, error: data.message || "Payment initiation failed", reference });
    }

    return jsonResponse({
      success: true,
      reference,
      paymentId: paymentRow.id,
      message: "Approve the prompt on your phone to complete payment.",
      providerData: data,
    });
  } catch (e: any) {
    console.error("dues-pay error", e);
    return jsonResponse({ success: false, error: e.message }, 500);
  }
});
