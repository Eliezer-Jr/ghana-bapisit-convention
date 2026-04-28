import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROG_SMS_URL = 'https://frogapi.wigal.com.gh/api/v3/sms/send';

interface SendPersonalizedRequest {
  senderid?: string;
  destinations: Array<{ destination: string; message: string; msgid?: string; smstype?: string }>;
}

const normalizePhone = (value: string) => {
  let phone = value.replace(/[\s-]/g, '');
  if (phone.startsWith('+')) phone = phone.substring(1);
  if (phone.startsWith('0')) phone = `233${phone.substring(1)}`;
  return phone;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');
    const senderId = Deno.env.get('FROGAPI_OTP_SENDER_ID') || 'GBCC';

    if (!apiKey || !username) {
      throw new Error('FrogAPI credentials not configured');
    }

    const body: SendPersonalizedRequest = await req.json();
    const destinations = (body.destinations || []).filter((dest) => dest.destination?.trim() && dest.message?.trim());

    if (destinations.length === 0) {
      throw new Error('At least one destination with a message is required');
    }

    const results = await Promise.all(destinations.map(async (dest, idx) => {
      const payload = {
        senderid: senderId,
        destination: normalizePhone(dest.destination),
        msgid: dest.msgid || `pmsg-${Date.now()}-${idx}`,
        message: dest.message,
        smstype: dest.smstype || 'text',
      };

      const response = await fetch(FROG_SMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': apiKey,
          'USERNAME': username,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, destination: payload.destination, data };
    }));

    const failed = results.filter((result) => !result.ok || !['ACCEPTD', 'ACCEPTED', 'SUCCESS'].includes(String(result.data?.status ?? '').toUpperCase()));

    return new Response(
      JSON.stringify({ success: failed.length === 0, data: results, error: failed[0]?.data?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error sending personalized Frog SMS:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
