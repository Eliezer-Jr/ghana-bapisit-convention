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
    const { phoneNumber, otp, fullName, isSignup } = await req.json();
    
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');

    if (!apiKey || !username) {
      throw new Error("FrogAPI credentials not configured");
    }

    console.log("Verifying OTP for:", phoneNumber);

    // Verify OTP with FrogAPI
    const verifyResponse = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify({
        number: phoneNumber,
        code: otp
      })
    });

    const verifyData = await verifyResponse.json();
    console.log("FrogAPI verify response:", verifyData);

    if (!verifyData.success || verifyData.status !== 'VERIFIED') {
      throw new Error("Invalid or expired OTP");
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create or authenticate user
    const email = `${phoneNumber}@otp.gbc.local`;
    const password = `otp_${phoneNumber}_${Date.now()}`;

    if (isSignup) {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          phone_number: phoneNumber,
          full_name: fullName
        }
      });

      if (authError) throw authError;

      // Update profile with phone number
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          phone_number: phoneNumber,
          full_name: fullName 
        })
        .eq('id', authData.user.id);

      if (profileError) console.error('Profile update error:', profileError);

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user,
          message: "Account created successfully"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Login existing user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Try to get user by phone number and create new password
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single();

        if (profile) {
          // Update password and sign in
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            profile.id,
            { password }
          );

          if (updateError) throw updateError;

          const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (retryError) throw retryError;

          return new Response(
            JSON.stringify({ 
              success: true, 
              session: retryAuth.session,
              message: "Login successful"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error("User not found. Please sign up first.");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          session: authData.session,
          message: "Login successful"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
