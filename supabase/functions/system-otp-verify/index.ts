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

    if (isSignup && !fullName) {
      throw new Error("Full name is required for signup");
    }

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!apiKey || !username) {
      throw new Error("FrogAPI credentials not configured");
    }

    console.log("Verifying OTP for system login:", phoneNumber);

    const otpCode = String(otp).trim();
    
    // Format phone number for Ghana
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = '233' + phoneNumber.substring(1);
    }
    
    const verifyPayload = {
      otpcode: otpCode,
      number: formattedNumber
    };

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
    console.log("FrogAPI verify response:", verifyData.status);

    const status = String(verifyData.status ?? '').toUpperCase();
    
    if (status === 'SYSTEM_ERROR') {
      throw new Error(verifyData.message || "OTP verification system error");
    }

    if (status === 'FAILED') {
      throw new Error(verifyData.message || "Invalid or expired OTP");
    }

    const successStatuses = new Set(['VERIFIED', 'SUCCESS', 'OK']);
    if (!successStatuses.has(status)) {
      throw new Error(verifyData.message || "OTP verification failed");
    }

    console.log("OTP verified successfully for system user");

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate a deterministic email for phone-based auth
    const email = `${phoneNumber}@system.local`;
    const tempPassword = `${phoneNumber}_verified_${Date.now()}`;
    
    if (isSignup) {
      // Create new user account with password
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        phone: phoneNumber,
        password: tempPassword,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone_number: phoneNumber
        }
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        throw new Error(signUpError.message || "Failed to create user account");
      }

      console.log("User created successfully:", signUpData.user?.id);
      
      // Generate session for new user
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (sessionError) {
        console.error("Session error:", sessionError);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created successfully. Please use the login option to access your account.",
          userId: signUpData.user?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Login - check if user exists
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error("List users error:", listError);
        throw new Error("Failed to verify user");
      }

      const existingUser = users.find(u => 
        u.phone === phoneNumber || u.email === email
      );

      if (!existingUser) {
        throw new Error("No account found with this phone number. Please sign up first.");
      }

      console.log("User found, logging in:", existingUser.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Login successful. You will be redirected shortly.",
          userId: existingUser.id,
          email: email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in system OTP verification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
