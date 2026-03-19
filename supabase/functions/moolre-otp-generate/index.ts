import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOOLRE_API_URL = 'https://api.moolre.com/open/sms/send';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const apiVasKey = Deno.env.get('MOOLRE_API_VASKEY');
    const senderId = Deno.env.get('MOOLRE_SENDER_ID');

    if (!apiVasKey) {
      throw new Error("Moolre API VAS Key not configured");
    }

    if (!senderId) {
      throw new Error("Moolre Sender ID not configured");
    }

    // Format phone number (remove leading zero for Ghana numbers)
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = '233' + phoneNumber.substring(1);
    }

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    
    const message = `Your Ghana Baptist Convention Conference verification code is: ${otpCode}. It will expire after 5 mins`;

    const postData = {
      type: 1,
      senderid: senderId,
      messages: [
        {
          recipient: formattedNumber,
          message: message,
          ref: `otp-${formattedNumber}-${Date.now()}`,
        },
      ],
    };

    console.log("Generating OTP for:", phoneNumber);

    const response = await fetch(MOOLRE_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-VasKey': apiVasKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();
    console.log("Moolre OTP send response:", JSON.stringify(data, null, 2));

    // Check if Moolre API returned an error
    if (data.status === 0 || data.code === 'AIN01') {
      throw new Error(`SMS delivery failed: ${data.message || 'Unknown error'}`);
    }

    // Only store OTP if SMS was sent successfully
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Upsert OTP record
    await supabase.from('otp_codes').upsert({
      phone_number: formattedNumber,
      otp_code: otpCode,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      used: false,
    }, { onConflict: 'phone_number' });

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
