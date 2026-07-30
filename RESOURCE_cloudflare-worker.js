// Cloudflare Worker helper for this project.
// Keep your OpenAI key in the Worker secret named OPENAI_API_KEY.

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Browser preflight support
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST from the frontend
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const body = await request.json();

      // Validate messages so the Worker fails safely
      if (!Array.isArray(body.messages)) {
        return new Response(
          JSON.stringify({ error: "Request must include a messages array." }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const openAIResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1",
            messages: body.messages,
          }),
        },
      );

      const data = await openAIResponse.json();

      return new Response(JSON.stringify(data), {
        status: openAIResponse.status,
        headers: corsHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Worker could not process this request.",
          details: String(error.message || error),
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },
};
