import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Profile {
  name: string;
  domain: string;
  locations: string[];
  goals: string[];
  focus?: string;
}

interface Payload {
  profile: Profile;
  columns: string[];
  rowCount: number;
  sample: Record<string, unknown>[];
  summary: Record<string, { min?: number; max?: number; sum?: number; mean?: number; unique?: number }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const payload = (await req.json()) as Payload;
    const { profile, columns, rowCount, sample, summary } = payload;

    const system = `You are InsightAgent, an agentic AI business analyst. You personalize every recommendation to the company profile.
You ALWAYS reason about: domain context, regional platform fit per location, and how each goal maps to channels.
Output strictly via the provided tool. Be specific, numeric, and actionable. No fluff.`;

    const user = `COMPANY PROFILE
- Name: ${profile.name}
- Domain: ${profile.domain}
- Locations: ${profile.locations.join(", ") || "Not specified"}
- Goals: ${profile.goals.join(", ") || "Not specified"}
- Current focus: ${profile.focus || "—"}

DATA SCHEMA
- Rows: ${rowCount}
- Columns: ${columns.join(", ")}
- Numeric summary: ${JSON.stringify(summary)}
- Sample (first rows): ${JSON.stringify(sample.slice(0, 8))}

Tasks:
1) Write 4-6 concise insights tying the data to the company profile.
2) Forecast: short trend (next period direction + % estimate), demand outlook, and per-channel marketing ROI estimates (1.0x-6.0x) appropriate for the domain + locations.
3) Recommend 5 marketing routes (Instagram, YouTube, Facebook, Google, Influencers, LinkedIn, TikTok, etc.) — pick channels that fit the domain + locations + goals. For each: priority (1-5), reasoning (why this channel for THIS company), budget % (sums to ~100), 3 hashtags, 2 content ideas.
4) 3 hashtags + 3 content ideas at the campaign level.
5) Optional: a "surprise" creative route.`;

    const tools = [{
      type: "function",
      function: {
        name: "deliver_analysis",
        description: "Return structured business analysis personalized to the company profile.",
        parameters: {
          type: "object",
          properties: {
            insights: { type: "array", items: { type: "string" } },
            predictions: {
              type: "object",
              properties: {
                trend: { type: "string" },
                trendPct: { type: "number" },
                demand: { type: "string" },
                channelRoi: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      channel: { type: "string" },
                      roi: { type: "number" },
                    },
                    required: ["channel", "roi"],
                  },
                },
                influencerImpact: { type: "string" },
              },
              required: ["trend", "trendPct", "demand", "channelRoi", "influencerImpact"],
            },
            routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  channel: { type: "string" },
                  priority: { type: "number" },
                  reasoning: { type: "string" },
                  budgetPct: { type: "number" },
                  timing: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  contentIdeas: { type: "array", items: { type: "string" } },
                },
                required: ["channel", "priority", "reasoning", "budgetPct", "timing", "hashtags", "contentIdeas"],
              },
            },
            campaignHashtags: { type: "array", items: { type: "string" } },
            campaignContentIdeas: { type: "array", items: { type: "string" } },
            surprise: { type: "string" },
          },
          required: ["insights", "predictions", "routes", "campaignHashtags", "campaignContentIdeas"],
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "deliver_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured output returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
