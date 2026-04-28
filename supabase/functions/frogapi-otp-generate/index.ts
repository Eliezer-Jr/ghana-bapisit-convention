import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROG_OTP_URL = 'https://frogapi.wigal.com.gh/api/v3/sms/otp/generate';

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
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');
    const senderId = Deno.env.get('FROGAPI_OTP_SENDER_ID') || 'GBCC';

    if (!apiKey || !username) {
      throw new Error('FrogAPI credentials not configured');
    }

    const formattedNumber = normalizePhone(phoneNumber);
    const payload = {
      number: formattedNumber,
      expiry: 5,
      length: 6,
      messagetemplate: 'Your Ghana Baptist Convention Conference verification code is: %OTPCODE%. It will expire after %EXPIRY% mins',
      type: 'NUMERIC',
      senderid: senderId,
    };

    const response = await fetch(FROG_OTP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const status = String(data?.status ?? '').toUpperCase();

    if (!response.ok || status !== 'SUCCESS') {
      return new Response(
        JSON.stringify({ success: false, error: data?.message || 'Failed to send OTP', data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data, message: data?.message || 'OTP sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error generating Frog OTP:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
