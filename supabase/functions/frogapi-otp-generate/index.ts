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

    // Format phone number for FrogAPI (use international format)
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = '233' + phoneNumber.substring(1);
    }

    const postData = {
      number: formattedNumber,
      expiry: 5,
      length: 6,
      messagetemplate: "Your Ghana Baptist Convention Conference verification code is: %OTPCODE%. It will expire after %EXPIRY% mins",
      type: "NUMERIC",
      senderid: senderId
    };

    console.log("Generating OTP for:", phoneNumber);
    console.log("Formatted number for FrogAPI:", formattedNumber);
    console.log("OTP generation payload:", JSON.stringify(postData, null, 2));

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
    console.log("FrogAPI OTP generation response:", JSON.stringify(data, null, 2));

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
