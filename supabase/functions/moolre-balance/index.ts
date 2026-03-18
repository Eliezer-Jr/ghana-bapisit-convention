import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOOLRE_API_URL = 'https://api.moolre.com/open/sms/query';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiVasKey = Deno.env.get('MOOLRE_API_VASKEY');

    if (!apiVasKey) {
      throw new Error('Moolre API VAS Key not configured');
    }

    const response = await fetch(MOOLRE_API_URL, {
      method: 'POST',
      headers: {
        'X-API-VASKEY': apiVasKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 2 }),
    });

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 200 : response.status
      }
    );
  } catch (error) {
    console.error('Error fetching balance:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
