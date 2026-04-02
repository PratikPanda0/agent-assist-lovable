import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EscalationRequest {
  userName: string;
  userEmail: string;
  userIntent: string;
  conversationSummary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    const { userName, userEmail, userIntent, conversationSummary }: EscalationRequest = await req.json();

    // Validate required fields
    if (!userName || !userEmail) {
      throw new Error("Missing required fields: userName and userEmail are required");
    }

    console.log("Sending escalation email for:", { userName, userEmail, userIntent });

    const emailResponse = await resend.emails.send({
      from: "Contact Center <onboarding@resend.dev>", // Use your verified domain in production
      to: ["kancherla.diwakar@firstsource.com"], // Replace with your support team email
      subject: "User Escalation - Human Agent Required",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #eee; }
            .summary { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚨 User Escalation Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A customer has requested human support</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">👤 User Name</div>
                <div class="value">${userName}</div>
              </div>
              <div class="field">
                <div class="label">📧 User Email</div>
                <div class="value"><a href="mailto:${userEmail}">${userEmail}</a></div>
              </div>
              <div class="field">
                <div class="label">🎯 User Intent</div>
                <div class="value">${userIntent || "Not specified"}</div>
              </div>
              <div class="field">
                <div class="label">📝 Conversation Summary</div>
                <div class="value summary">${conversationSummary || "No conversation history available"}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Escalation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Escalation email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending escalation email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
