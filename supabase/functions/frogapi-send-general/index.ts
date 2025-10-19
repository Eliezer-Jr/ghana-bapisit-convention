import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const apiKey = Deno.env.get('FROGAPI_KEY');
    const username = Deno.env.get('FROGAPI_USERNAME');

    if (!apiKey || !username) {
      throw new Error('FrogAPI credentials not configured');
    }

    const body: SendGeneralRequest = await req.json();
    
    const postData = {
      senderid: body.senderid,
      destinations: body.destinations,
      message: body.message,
      smstype: body.smstype || 'text'
    };

    const response = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify(postData)
    });

    const data = await response.json();
    
    console.log('SMS sent:', data);
    
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
