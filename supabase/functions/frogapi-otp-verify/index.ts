import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROG_VERIFY_URL = 'https://frogapi.wigal.com.gh/api/v3/sms/otp/verify';

const normalizePhone = (value: string) => {
  let phone = value.trim().replace(/[\s-]/g, '');
  if (phone.startsWith('+')) phone = phone.substring(1);
  if (phone.startsWith('0')) phone = `233${phone.substring(1)}`;
  if (!phone.match(/^233\d{9}$/)) {
    throw new Error('Invalid phone number format');
  }
  return phone;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, otp } = await req.json();

    if (!phoneNumber || !otp) {
      throw new Error('Phone number and OTP are required');
    }

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');

    if (!apiKey || !username) {
      throw new Error('FrogAPI credentials not configured');
    }

    const response = await fetch(FROG_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username,
      },
      body: JSON.stringify({
        otpcode: String(otp).trim(),
        number: normalizePhone(phoneNumber),
      }),
    });

    const data = await response.json();
    const status = String(data?.status ?? '').toUpperCase();
    const successStatuses = new Set(['VERIFIED', 'SUCCESS', 'OK']);

    if (!response.ok || !successStatuses.has(status)) {
      return new Response(
        JSON.stringify({ success: false, error: data?.message || 'Invalid or expired OTP', data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: data?.message || 'OTP verified successfully', data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error verifying Frog OTP:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
