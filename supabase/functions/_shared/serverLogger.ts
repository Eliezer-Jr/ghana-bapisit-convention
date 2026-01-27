// Server-side error logging utility for edge functions
// This file should only be imported in Deno/edge function context

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export async function logServerError(
  functionName: string,
  error: Error | string,
  metadata?: Record<string, unknown>,
  severity: ErrorSeverity = 'error'
) {
  const isError = error instanceof Error;
  
  // Always log to console (captured in edge function logs)
  console.error(`[${functionName}]`, error, metadata);
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('error_logs').insert({
        source: 'server',
        function_name: functionName,
        error_message: isError ? error.message : error,
        stack_trace: isError ? error.stack : undefined,
        metadata,
        severity,
      });
    }
  } catch (logError) {
    console.error('[logServerError] Failed to store error:', logError);
  }
}
