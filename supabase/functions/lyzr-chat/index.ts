import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to detect if the agent response indicates escalation was completed
function detectEscalationComplete(response: string): boolean {
  const escalationPhrases = [
    "shared your details",
    "human agent will contact",
    "support team will reach",
    "escalated your request",
    "team will contact you",
    "forwarded to our support",
    "agent will be in touch",
    "submitted your escalation"
  ];
  const lowerResponse = response.toLowerCase();
  return escalationPhrases.some(phrase => lowerResponse.includes(phrase));
}

// Helper to extract user details from conversation
function extractUserDetails(messages: string): { name?: string; email?: string; intent?: string } {
  const details: { name?: string; email?: string; intent?: string } = {};
  
  // Extract email
  const emailMatch = messages.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    details.email = emailMatch[0];
  }
  
  // Extract name - look for patterns like "my name is X" or "I'm X" or "I am X"
  const namePatterns = [
    /my name is ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
    /i'm ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
    /i am ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
    /this is ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
    /call me ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = messages.match(pattern);
    if (match && match[1]) {
      details.name = match[1].trim();
      break;
    }
  }
  
  return details;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LYZR_API_KEY = Deno.env.get("LYZR_API_KEY");
    if (!LYZR_API_KEY) {
      throw new Error("LYZR_API_KEY is not configured");
    }

    const { message, user_id, session_id, escalate, conversation_history } = await req.json();

    const agentId = "694539fff6d93e181164e53e";
    const userId = user_id || "kancherla.diwakar@firstsource.com";
    const sessionId = session_id || `${agentId}-${Date.now()}`;

    // Build the message with full conversation context
    // This ensures the Lyzr agent has context about the ongoing conversation
    let fullMessage = message;
    
    if (conversation_history && conversation_history.trim()) {
      // Prepend conversation history to the current message so Lyzr maintains context
      fullMessage = `[CONVERSATION CONTEXT - Please maintain this context and continue the conversation appropriately]\n${conversation_history}\n\n[NEW USER MESSAGE]\n${message}`;
    }
    
    if (escalate) {
      fullMessage = `[ESCALATION REQUEST] The user wants to escalate this issue to a human agent. You must collect their name and email before proceeding. Previous context: ${message}`;
    }

    console.log("Calling Lyzr API with:", { agentId, userId, sessionId, messageLength: fullMessage.length });

    const response = await fetch("https://agent-prod.studio.lyzr.ai/v3/inference/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LYZR_API_KEY,
      },
      body: JSON.stringify({
        user_id: userId,
        agent_id: agentId,
        session_id: sessionId,
        message: fullMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lyzr API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to communicate with AI agent",
          details: errorText 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Lyzr API response:", data);

    const responseText = data.response || data.message || data.output || JSON.stringify(data);
    
    // Check if agent indicates escalation is complete and we have conversation history
    let emailSent = false;
    if (conversation_history && detectEscalationComplete(responseText)) {
      console.log("Escalation detected, attempting to send email...");
      
      // Extract user details from conversation
      const allMessages = conversation_history + "\n" + message;
      const userDetails = extractUserDetails(allMessages);
      
      console.log("Extracted user details:", userDetails);
      
      if (userDetails.email) {
        try {
          // Create Supabase client to call the email function
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          
          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Call the escalation email function
            const { error: emailError } = await supabase.functions.invoke("send-escalation-email", {
              body: {
                userName: userDetails.name || "Unknown",
                userEmail: userDetails.email,
                userIntent: "Customer requested human agent support",
                conversationSummary: allMessages,
              },
            });
            
            if (emailError) {
              console.error("Error sending escalation email:", emailError);
            } else {
              console.log("Escalation email sent successfully");
              emailSent = true;
            }
          }
        } catch (emailErr) {
          console.error("Failed to send escalation email:", emailErr);
        }
      } else {
        console.log("No email found in conversation, cannot send escalation email");
      }
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        session_id: sessionId,
        escalated: escalate || false,
        email_sent: emailSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
