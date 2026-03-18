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
    const { phoneNumber, otp, fullName, isSignup, skipNameRequirement } = await req.json();
    
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    if (isSignup && !fullName && !skipNameRequirement) {
      throw new Error("Full name is required for signup");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log("Verifying OTP for system login:", phoneNumber);

    const otpCode = String(otp).trim();
    
    // Format phone number for Ghana (E.164)
    let formattedNumber = phoneNumber.trim().replace(/[\s-]/g, '');
    
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '+233' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('233')) {
      formattedNumber = '+' + formattedNumber;
    } else if (!formattedNumber.startsWith('+233')) {
      throw new Error("Phone number must start with 0 or 233");
    }
    
    if (!formattedNumber.match(/^\+233\d{9}$/)) {
      throw new Error("Invalid phone number format (E.164 required)");
    }

    // Format for DB lookup (without +)
    const dbNumber = formattedNumber.substring(1); // 233XXXXXXXXX

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify OTP from database
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone_number', dbNumber)
      .eq('used', false)
      .single();

    if (fetchError || !otpRecord) {
      throw new Error("No valid OTP found. Please request a new OTP.");
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from('otp_codes').update({ used: true }).eq('phone_number', dbNumber);
      throw new Error("OTP has expired. Please request a new one.");
    }

    if (otpRecord.otp_code !== otpCode) {
      throw new Error("Invalid OTP. Please check and try again.");
    }

    // Mark OTP as used
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('phone_number', dbNumber);

    console.log("OTP verified successfully for system user");

    // Generate a deterministic email for phone-based auth
    const email = `${phoneNumber}@system.local`;
    
    // Check if user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error("Failed to check existing users");
    }

    const existingUser = users.find(u => {
      return u.phone === phoneNumber || 
        u.phone === formattedNumber ||
        u.email === email ||
        u.user_metadata?.phone_number === phoneNumber ||
        (u.phone && u.phone.endsWith(phoneNumber.substring(1))) ||
        (u.email && u.email.startsWith(phoneNumber + '@'));
    });

    if (isSignup && !existingUser) {
      const displayName = fullName || "Minister (pending)";
      const tempPassword = `${phoneNumber}_verified_${Date.now()}`;
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        phone: formattedNumber,
        password: tempPassword,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          full_name: displayName,
          phone_number: phoneNumber
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message || "Failed to create user account");
      }
      
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
      const loginPassword = `${phoneNumber}_login_${Date.now()}`;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: loginPassword }
      );

      if (updateError) {
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
