import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  applicationId: string;
  status: string;
  recipientPhone: string;
  recipientName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, status, recipientPhone, recipientName }: NotificationRequest = await req.json();
    
    console.log('Processing status notification:', { applicationId, status, recipientPhone });

    // Create status-specific message
    let message = '';
    switch (status) {
      case 'submitted':
        message = `Dear ${recipientName}, your ministerial application has been submitted successfully and is under review. You will be notified of any updates. - Gospel Believers Church`;
        break;
      case 'local_screening':
        message = `Dear ${recipientName}, your application is currently under local screening. We will keep you informed of the progress. - Gospel Believers Church`;
        break;
      case 'association_approved':
        message = `Dear ${recipientName}, your application has been approved at the association level and is proceeding to the next stage. - Gospel Believers Church`;
        break;
      case 'vp_review':
        message = `Dear ${recipientName}, your application is now under Vice President review. - Gospel Believers Church`;
        break;
      case 'interview_scheduled':
        message = `Dear ${recipientName}, your interview has been scheduled! Please check your applicant portal for details and download your interview letter. - Gospel Believers Church`;
        break;
      case 'approved':
        message = `Congratulations ${recipientName}! Your ministerial application has been approved. Please log in to download your admission letter. - Gospel Believers Church`;
        break;
      case 'rejected':
        message = `Dear ${recipientName}, your application status has been updated. Please check your portal for detailed feedback and next steps. - Gospel Believers Church`;
        break;
      default:
        message = `Dear ${recipientName}, your application status has been updated to: ${status.replace(/_/g, ' ')}. Please check your portal for details. - Gospel Believers Church`;
    }

    // Call FrogAPI to send SMS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase.functions.invoke('frogapi-send-general', {
      body: {
        recipients: [recipientPhone],
        message: message
      }
    });

    if (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }

    console.log('SMS sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in notify-status-change:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
