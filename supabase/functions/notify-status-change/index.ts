import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOOLRE_API_URL = 'https://api.moolre.com/open/sms/send';

interface NotificationRequest {
  applicationId: string;
  status: string;
  recipientPhone: string;
  recipientName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, status, recipientPhone, recipientName }: NotificationRequest = await req.json();

    console.log("Processing status notification:", { applicationId, status, recipientPhone });

    let message = "";
    switch (status) {
      case "submitted":
        message = `Dear ${recipientName}, your ministerial application has been submitted successfully and is under review. You will be notified of any updates. - Ghana Baptist Convention Conference`;
        break;
      case "local_screening":
        message = `Dear ${recipientName}, your application is currently under local screening. We will keep you informed of the progress. - Ghana Baptist Convention Conference`;
        break;
      case "association_approved":
        message = `Dear ${recipientName}, your application has been approved at the association level and is proceeding to the next stage. - Ghana Baptist Convention Conference`;
        break;
      case "vp_review":
        message = `Dear ${recipientName}, your application is now under Vice President review. - Ghana Baptist Convention Conference`;
        break;
      case "interview_scheduled":
        message = `Dear ${recipientName}, your interview has been scheduled! Please check your applicant portal for details and download your interview letter. - Ghana Baptist Convention Conference`;
        break;
      case "approved":
        message = `Congratulations ${recipientName}! Your ministerial application has been approved. Please log in to download your admission letter. - Ghana Baptist Convention Conference`;
        break;
      case "rejected":
        message = `Dear ${recipientName}, your application status has been updated. Please check your portal for detailed feedback and next steps. - Ghana Baptist Convention Conference`;
        break;
      default:
        message = `Dear ${recipientName}, your application status has been updated to: ${status.replace(/_/g, " ")}. Please check your portal for details. - Ghana Baptist Convention Conference`;
    }

    const apiVasKey = Deno.env.get("MOOLRE_API_VASKEY");
    const senderId = Deno.env.get("MOOLRE_SENDER_ID") || "GBCC";

    if (!apiVasKey) {
      throw new Error("Moolre API VAS Key not configured");
    }

    // Format phone number
    let formattedPhone = recipientPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    }

    const postData = {
      type: 1,
      senderid: senderId,
      messages: [
        {
          recipient: formattedPhone,
          message: message,
          ref: `notify-${applicationId}-${Date.now()}`,
        },
      ],
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
    console.log("SMS sent successfully via Moolre:", data);

    return new Response(JSON.stringify({ success: true, message: "Notification sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in notify-status-change:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
