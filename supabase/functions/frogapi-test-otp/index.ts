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
    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');
    const senderId = Deno.env.get('FROGAPI_OTP_SENDER_ID');

    if (!apiKey || !username || !senderId) {
      throw new Error("FrogAPI credentials not configured");
    }

    const testNumber = "0557083554";

    // Step 1: Generate OTP
    console.log("=== STEP 1: Generating OTP ===");
    const generatePayload = {
      number: testNumber,
      expiry: 5,
      length: 6,
      messagetemplate: "Test OTP: %OTPCODE%. Expires in %EXPIRY% mins",
      type: "NUMERIC",
      senderid: senderId
    };
    console.log("Generate payload:", JSON.stringify(generatePayload, null, 2));

    const generateResponse = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify(generatePayload)
    });

    const generateData = await generateResponse.json();
    console.log("Generate response:", JSON.stringify(generateData, null, 2));

    // Step 2: Try to verify with a test code
    console.log("\n=== STEP 2: Attempting Verification ===");
    const verifyPayload = {
      number: testNumber,
      code: "123456" // test code
    };
    console.log("Verify payload:", JSON.stringify(verifyPayload, null, 2));

    const verifyResponse = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify(verifyPayload)
    });

    const verifyData = await verifyResponse.json();
    console.log("Verify response:", JSON.stringify(verifyData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        generate: generateData,
        verify: verifyData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
