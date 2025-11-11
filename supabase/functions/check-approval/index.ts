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
    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ approved: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formatPhone = (phone: string): string => {
      let cleaned = phone.trim();
      if (cleaned.startsWith('0')) cleaned = '233' + cleaned.slice(1);
      if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
      return cleaned;
    };

    const formatted = formatPhone(phoneNumber);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from('approved_applicants')
      .select('id, used')
      .eq('phone_number', formatted)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ approved: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const approved = !!data && data.used === false;

    return new Response(
      JSON.stringify({ approved, formatted }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ approved: false, error: e.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
