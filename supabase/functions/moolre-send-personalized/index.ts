import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOOLRE_API_URL = 'https://api.moolre.com/open/sms/send';

interface SendPersonalizedRequest {
  senderid: string;
  destinations: Array<{
    destination: string;
    message: string;
    msgid?: string;
    smstype?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiVasKey = Deno.env.get('MOOLRE_API_VASKEY');

    if (!apiVasKey) {
      throw new Error('Moolre API VAS Key not configured');
    }

    const body: SendPersonalizedRequest = await req.json();
    
    // Convert to Moolre format - each destination has its own message
    const postData = {
      type: 1,
      senderid: body.senderid,
      messages: body.destinations.map((dest, idx) => ({
        recipient: dest.destination,
        message: dest.message,
        ref: dest.msgid || `pmsg-${Date.now()}-${idx}`,
      })),
    };

    const response = await fetch(MOOLRE_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-VasKey': apiVasKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();
    
    console.log('Personalized SMS sent via Moolre:', data);
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 200 : response.status
      }
    );
  } catch (error) {
    console.error('Error sending personalized SMS:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
