import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, otp } = await req.json();
    
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');

    if (!apiKey || !username) {
      throw new Error("FrogAPI credentials not configured");
    }

    console.log("Verifying OTP for:", phoneNumber, "OTP length:", otp?.length, "OTP value:", otp);

    // Validate OTP format
    if (!otp || String(otp).trim().length === 0) {
      throw new Error("OTP code is required");
    }

    const otpCode = String(otp).trim();
    
    // Ensure phone number is in correct format (remove leading zero for Ghana numbers)
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = '233' + phoneNumber.substring(1);
    }
    
    const verifyPayload = {
      otpcode: otpCode,  // FrogAPI expects 'otpcode' not 'code'
      number: formattedNumber
    };

    console.log("FrogAPI verify request payload:", JSON.stringify(verifyPayload));

    // Verify OTP with FrogAPI
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
    console.log("FrogAPI verify response:", JSON.stringify(verifyData));
    console.log("Response status:", verifyData.status);

    // Check if verification was successful
    const status = String(verifyData.status ?? '').toUpperCase();
    if (status === 'SYSTEM_ERROR') {
      console.error("System error from FrogAPI:", verifyData.message);
      
      // Provide helpful message for common issue
      if (verifyData.message && verifyData.message.includes("null")) {
        throw new Error("OTP verification is not available yet. Please wait a moment after receiving the SMS and try again. If the issue persists, request a new OTP.");
      }
      
      throw new Error(`Verification system error: ${verifyData.message || "Unknown error"}`);
    }

    if (status === 'FAILED') {
      console.error("Verification failed:", verifyData.message);
      throw new Error(verifyData.message || "Invalid or expired OTP. Please check and try again.");
    }

    // Accept SUCCESS/VERIFIED/OK as success statuses from FrogAPI
    const successStatuses = new Set(['VERIFIED', 'SUCCESS', 'OK']);
    if (!successStatuses.has(status)) {
      console.error("Unexpected status from FrogAPI:", status, "full response:", verifyData);
      throw new Error(verifyData.message || `OTP verification failed. Please request a new OTP and try again.`);
    }

    console.log("OTP verified successfully - no auth user created");

    // Return success without creating auth user
    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in OTP verification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
