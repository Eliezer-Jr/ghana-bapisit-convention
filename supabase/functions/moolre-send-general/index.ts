import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOOLRE_API_URL = 'https://api.moolre.com/open/sms/send';

interface SendGeneralRequest {
  senderid: string;
  destinations: Array<{
    destination: string;
    msgid?: string;
  }>;
  message: string;
  smstype?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiVasKey = Deno.env.get('MOOLRE_API_VASKEY');
    const senderId = Deno.env.get('MOOLRE_SENDER_ID') || 'GBCC';

    if (!apiVasKey) {
      throw new Error('Moolre API VAS Key not configured');
    }

    const body: SendGeneralRequest = await req.json();
    
    // Convert to Moolre format - always use server-side sender ID
    const postData = {
      type: 1,
      senderid: senderId,
      messages: body.destinations.map((dest, idx) => ({
        recipient: dest.destination,
        message: body.message,
        ref: dest.msgid || `msg-${Date.now()}-${idx}`,
      })),
    };

    const response = await fetch(MOOLRE_API_URL, {
      method: 'POST',
      headers: {
        'X-API-VASKEY': apiVasKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();
    
    console.log('SMS sent via Moolre:', data);
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 200 : response.status
      }
    );
  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
