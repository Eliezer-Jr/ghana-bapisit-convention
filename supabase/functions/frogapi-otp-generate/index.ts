import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');
    const senderId = Deno.env.get('FROGAPI_OTP_SENDER_ID');

    if (!apiKey || !username) {
      throw new Error("FrogAPI credentials not configured");
    }

    if (!senderId) {
      throw new Error("FrogAPI OTP Sender ID not configured");
    }

    const postData = {
      number: phoneNumber,
      expiry: 5,
      length: 6,
      messagetemplate: "Your Ghana Baptist Convention verification code is: %OTPCODE%. It will expire after %EXPIRY% mins",
      type: "NUMERIC",
      senderid: senderId
    };

    console.log("Generating OTP for:", phoneNumber);

    const response = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify(postData)
    });

    const data = await response.json();
    console.log("FrogAPI response:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
