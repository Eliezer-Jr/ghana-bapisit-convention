import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoryRequest {
  service?: string;
  servicetype?: string;
  datefrom: string;
  dateto: string;
  senderid?: string;
  status?: string;
  msgid?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('$2a$10$AesQdII2SKJRmzpwYymtHekB./uRwoTd1EzscUMMmwvpetUULnz76');
    const username = Deno.env.get('eliezera');

    if (!apiKey || !username) {
      throw new Error('FrogAPI credentials not configured');
    }

    const body: HistoryRequest = await req.json();

    const response = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    console.log('History fetched:', data);
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 200 : response.status
      }
    );
  } catch (error) {
    console.error('Error fetching history:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
