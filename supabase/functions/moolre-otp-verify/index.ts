import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log("Verifying OTP for:", phoneNumber, "OTP length:", otp?.length);

    const otpCode = String(otp).trim();
    
    // Format phone number
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = '233' + phoneNumber.substring(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the OTP in the database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', formattedNumber)
      .eq('used', false)
      .single();

    if (fetchError || !otpRecord) {
      throw new Error("No valid OTP found. Please request a new OTP.");
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Mark as used
      await supabase.from('otp_codes').update({ used: true }).eq('phone_number', formattedNumber);
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Check code
    if (otpRecord.otp_code !== otpCode) {
      throw new Error("Invalid OTP. Please check and try again.");
    }

    // Mark OTP as used
    await supabase.from('otp_codes').update({ used: true }).eq('phone_number', formattedNumber);

    console.log("OTP verified successfully");

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
