import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LYZR_VOICE_BASE = "https://voice-livekit.studio.lyzr.ai";
const AGENT_ID = "69baaa1eacdaaa90b7005491";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LYZR_API_KEY = Deno.env.get("LYZR_API_KEY");
    if (!LYZR_API_KEY) {
      throw new Error("LYZR_API_KEY is not configured");
    }

    const { action, roomName } = await req.json();

    if (action === "start") {
      const userIdentity = `user-${Date.now()}`;
      console.log("Starting voice session for agent:", AGENT_ID, "user:", userIdentity);

      const response = await fetch(`${LYZR_VOICE_BASE}/v1/sessions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LYZR_API_KEY,
        },
        body: JSON.stringify({
          agentId: AGENT_ID,
          userIdentity: userIdentity,
        }),
      });

      const startText = await response.text();
      console.log("Start session response:", startText);
      let data;
      try {
        data = JSON.parse(startText);
      } catch {
        throw new Error(`Invalid response from voice API: ${startText.slice(0, 200)}`);
      }

      if (!response.ok) {
        return new Response(JSON.stringify({ error: data.error || "Failed to start session", details: data }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "end") {
      if (!roomName) {
        return new Response(JSON.stringify({ error: "roomName is required to end a session" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Ending voice session, room:", roomName);

      const response = await fetch(`${LYZR_VOICE_BASE}/v1/sessions/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LYZR_API_KEY,
        },
        body: JSON.stringify({ roomName }),
      });

      const text = await response.text();
      console.log("End session response:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || "Session ended", ok: response.ok };
      }

      return new Response(JSON.stringify(data), {
        status: response.ok ? 200 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'start' or 'end'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
