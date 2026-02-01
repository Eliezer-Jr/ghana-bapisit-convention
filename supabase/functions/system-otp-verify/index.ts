import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    // base64url -> base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');
    
    // Use self-hosted Supabase for auth operations
    const supabaseUrl = Deno.env.get('SELF_HOSTED_DB_URL')!;
    const supabaseServiceKey = Deno.env.get('SELF_HOSTED_SERVICE_ROLE_KEY')!;

    if (!apiKey || !username) {
      throw new Error("FrogAPI credentials not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Self-hosted Supabase credentials not configured");
    }

    // Preflight: ensure the provided key is actually a service_role JWT for the *self-hosted* instance.
    // If this is the anon key or a key from a different instance, GoTrue returns `403 not_admin`.
    const keyPayload = decodeJwtPayload(supabaseServiceKey);
    const keyRole = typeof keyPayload?.role === 'string' ? (keyPayload.role as string) : undefined;
    if (keyRole && keyRole !== 'service_role') {
      throw new Error(
        `SELF_HOSTED_SERVICE_ROLE_KEY must be a service_role JWT (got role=${keyRole}). ` +
          `Make sure you pasted the self-hosted SERVICE ROLE key, not the anon/publishable key.`
      );
    }

    console.log("Verifying OTP for system login:", phoneNumber);
    console.log("Using self-hosted Supabase URL:", supabaseUrl);
    console.log("Self-hosted key role claim:", keyRole ?? 'unknown');

    const otpCode = String(otp).trim();
    
    // Format phone number for Ghana (E.164 format: +233XXXXXXXXX)
    let formattedNumber = phoneNumber.trim().replace(/[\s-]/g, '');
    
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '+233' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('233')) {
      formattedNumber = '+' + formattedNumber;
    } else if (!formattedNumber.startsWith('+233')) {
      throw new Error("Phone number must start with 0 or 233");
    }
    
    if (!formattedNumber.match(/^\+233\d{9}$/)) {
      console.error("Invalid phone format:", formattedNumber);
      throw new Error("Invalid phone number format (E.164 required)");
    }
    
    console.log("Formatted phone number:", formattedNumber);
    
    // Verify OTP with FrogAPI
    const verifyResponse = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify({
        otpcode: otpCode,
        number: formattedNumber.substring(1)
      })
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

    console.log("OTP verified successfully");

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const email = `${phoneNumber}@system.local`;
    const loginPassword = `${phoneNumber}_secure_${Date.now()}`;
    const displayName = fullName || "Minister (pending)";

    let userId: string;
    let userExists = false;

    // Try to create user - if they exist, we'll get an error
    console.log("Attempting to create/find user with email:", email);
    
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      phone: formattedNumber,
      password: loginPassword,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: displayName,
        phone_number: phoneNumber
      }
    });

    if (createError) {
      // Check if user already exists
      const errorMessage = createError.message?.toLowerCase() || '';
      if (errorMessage.includes('already') || errorMessage.includes('exists') || errorMessage.includes('registered')) {
        console.log("User already exists, will update password");
        userExists = true;
      } else {
        console.error("Create user error:", createError);
        throw new Error(createError.message || "Failed to create user account");
      }
    } else {
      console.log("User created successfully:", createData.user?.id);
      userId = createData.user!.id;
    }

    // If user exists, we need to find them and update password
    if (userExists) {
      if (!isSignup) {
        // For login, this is expected - user exists
        console.log("Login flow: User exists, fetching user list to find them");
      } else {
        // For signup, user already exists - treat as login
        console.log("Signup flow: User already exists, switching to login");
      }

      // Since we can't list users, try signing in with a temporary approach
      // First, let's try to get the user by attempting various lookups
      
      // Try to sign in with a wrong password to verify user exists and get error info
      const { error: testError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: 'wrong_password_test'
      });

      if (testError) {
        const testErrorMsg = testError.message?.toLowerCase() || '';
        if (testErrorMsg.includes('invalid') || testErrorMsg.includes('credentials')) {
          // User exists! Now we need to update their password
          // We'll use the magic link approach or admin update
          
          // Try to update user by email using admin API
          // First get all users (if we have permission) or use alternative method
          try {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (listError) {
              console.error("Cannot list users:", listError.message);
              // Alternative: Use signInWithOtp or other method
              throw new Error("Cannot verify existing user. Please contact administrator.");
            }

            const existingUser = users.find(u => 
              u.email === email || 
              u.phone === formattedNumber ||
              u.user_metadata?.phone_number === phoneNumber
            );

            if (!existingUser) {
              throw new Error("User account not found. Please try signing up.");
            }

            userId = existingUser.id;
            
            // Update password
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              userId,
              { password: loginPassword }
            );

            if (updateError) {
              console.error("Failed to update password:", updateError);
              throw new Error("Failed to prepare login session");
            }
            
            console.log("Password updated for existing user:", userId);
          } catch (innerError) {
            console.error("Error finding user:", innerError);
            throw innerError;
          }
        } else if (testErrorMsg.includes('not found') || testErrorMsg.includes('no user')) {
          throw new Error("No account found. Please sign up first.");
        } else {
          console.error("Unexpected auth error:", testError);
          throw new Error("Authentication error: " + testError.message);
        }
      }
    }

    // Now sign in to get the session
    console.log("Signing in to get session...");
    
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: loginPassword
    });

    if (signInError) {
      console.error("Sign in error:", signInError);
      throw new Error("Failed to create session: " + signInError.message);
    }

    if (!signInData.session) {
      throw new Error("No session returned from sign in");
    }

    console.log("Session created successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: isSignup && !userExists ? "Account created successfully." : "Login successful.",
        userId: signInData.user?.id,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_in: signInData.session.expires_in,
          expires_at: signInData.session.expires_at,
          token_type: signInData.session.token_type,
          user: signInData.session.user
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
