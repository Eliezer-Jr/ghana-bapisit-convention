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
    const { phoneNumber, otp, fullName, isSignup, skipNameRequirement } = await req.json();
    
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    // Allow skipping fullName requirement for flows like minister intake where name is collected later
    if (isSignup && !fullName && !skipNameRequirement) {
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
    
    // Format phone number for Ghana (E.164 format: +233XXXXXXXXX, total 13 chars)
    let formattedNumber = phoneNumber.trim();
    
    // Remove any spaces or dashes
    formattedNumber = formattedNumber.replace(/[\s-]/g, '');
    
    // Convert to E.164 format
    if (formattedNumber.startsWith('0')) {
      // Ghana local format: 0XXXXXXXXX -> +233XXXXXXXXX
      formattedNumber = '+233' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('233')) {
      // Already has country code but missing +
      formattedNumber = '+' + formattedNumber;
    } else if (!formattedNumber.startsWith('+233')) {
      // Invalid format
      throw new Error("Phone number must start with 0 or 233");
    }
    
    // Validate E.164 format: +233XXXXXXXXX (13 characters total)
    if (!formattedNumber.match(/^\+233\d{9}$/)) {
      console.error("Invalid phone format:", formattedNumber);
      throw new Error("Invalid phone number format (E.164 required)");
    }
    
    console.log("Formatted phone number:", formattedNumber);
    
    const verifyPayload = {
      otpcode: otpCode,
      number: formattedNumber.substring(1) // FrogAPI expects without + (233XXXXXXXXX)
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
    
    // First, check if user already exists with this phone number
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      throw new Error("Failed to check existing users");
    }

    // Try multiple matching strategies to find existing user
    const existingUser = users.find(u => {
      return u.phone === phoneNumber || 
        u.phone === formattedNumber ||
        u.email === email ||
        u.user_metadata?.phone_number === phoneNumber ||
        (u.phone && u.phone.endsWith(phoneNumber.substring(1))) ||
        (u.email && u.email.startsWith(phoneNumber + '@'));
    });

    if (isSignup && !existingUser) {
      console.log("Creating user with phone:", formattedNumber, "email:", email);
      
      // Create new user account with password (use E.164 formatted phone)
      const displayName = fullName || "Minister (pending)";
      const tempPassword = `${phoneNumber}_verified_${Date.now()}`;
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        phone: formattedNumber, // Must be E.164: +233XXXXXXXXX
        password: tempPassword,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          full_name: displayName,
          phone_number: phoneNumber // Keep original format in metadata for display
        }
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        throw new Error(signUpError.message || "Failed to create user account");
      }

      console.log("User created successfully:", signUpData.user?.id);
      
      // Generate login credentials for the new user
      const loginPassword = `${phoneNumber}_login_${Date.now()}`;
      await supabaseAdmin.auth.admin.updateUserById(signUpData.user!.id, { password: loginPassword });
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created successfully.",
          userId: signUpData.user?.id,
          email: email,
          password: loginPassword
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (existingUser) {
      // User exists - proceed with login flow regardless of isSignup flag
      console.log("User found, generating session:", existingUser.id);

      // Update user password to enable sign in
      const loginPassword = `${phoneNumber}_login_${Date.now()}`;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: loginPassword }
      );

      if (updateError) {
        console.error("Failed to update password:", updateError);
        throw new Error("Failed to generate login session");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Login successful. You will be redirected shortly.",
          userId: existingUser.id,
          email: existingUser.email,
          password: loginPassword
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // No user found and not a signup request
      console.error("No matching user found for login request");
      
      // Check if this might be an applicant-only account
      const isApplicantAccount = users.some(u => 
        u.email?.includes('@otp.gbc.local') && 
        u.user_metadata?.phone_number === phoneNumber
      );
      
      if (isApplicantAccount) {
        throw new Error("This phone number is registered for applications only. Please use the 'Apply' page to access your application, or contact an administrator to get system access.");
      }
      
      throw new Error(`No system account found with phone number ${phoneNumber}. Please contact an administrator to create your account, or use 'Sign Up' if you're creating a new account.`);
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
