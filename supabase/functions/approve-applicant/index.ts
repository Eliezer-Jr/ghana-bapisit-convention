import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, notes } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Check if phone number already exists
    const { data: existingApproval, error: checkError } = await supabase
      .from('approved_applicants')
      .select()
      .eq('phone_number', formattedPhone)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing approval:', checkError);
      return new Response(
        JSON.stringify({ success: false, error: checkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let approvedData;

    if (existingApproval) {
      // Update notes if provided
      if (notes) {
        const { data: updatedData, error: updateError } = await supabase
          .from('approved_applicants')
          .update({ notes })
          .eq('id', existingApproval.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating notes:', updateError);
        } else {
          approvedData = updatedData;
        }
      } else {
        approvedData = existingApproval;
      }

      console.log('Phone number already approved:', formattedPhone);
    } else {
      // Insert new approved applicant record
      const { data: insertedData, error: insertError } = await supabase
        .from('approved_applicants')
        .insert({
          phone_number: formattedPhone,
          approved_by: user.id,
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting approved applicant:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      approvedData = insertedData;
    }

    // Send SMS notification using FrogAPI
    const frogApiUsername = Deno.env.get('FROGAPI_USERNAME');
    const frogApiKey = Deno.env.get('FROGAPI_KEY');
    const frogApiSenderId = Deno.env.get('FROGAPI_OTP_SENDER_ID');

    if (frogApiUsername && frogApiKey && frogApiSenderId) {
      const message = `Your phone number has been approved to apply for ministerial admission. Please visit the application portal and use OTP verification to proceed.`;

      const smsPayload = {
        username: frogApiUsername,
        password: frogApiKey,
        sender_id: frogApiSenderId,
        message: message,
        destinations: [formattedPhone.replace('+', '')],
      };

      try {
        const smsResponse = await fetch('https://api.frogapi.net/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(smsPayload),
        });

        const smsResult = await smsResponse.json();
        console.log('SMS notification sent:', smsResult);
      } catch (smsError) {
        console.error('Error sending SMS notification:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: approvedData,
        message: 'Applicant approved and SMS notification sent'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in approve-applicant function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});