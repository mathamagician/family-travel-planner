import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a family travel packing expert.

Output ONLY a raw JSON array (no markdown, no code fences, no explanation). Start your response with [ and end with ].

Generate 25-35 practical packing items. Each item:
{"id":"snake_id","category":"documents|clothing|baby_gear|toiletries|health_safety|activities|snacks|tech|outdoor|misc","name":"Item name","quantity":1,"quantity_note":"1 per day or null","notes":"One brief tip or null","essential":true,"age_relevant":false,"affiliate_search":"amazon search query or null","affiliate_url":null}

Rules:
- essential:true only for truly critical items
- notes: one sentence max, null if obvious
- Include age-appropriate items for each child
- Beach/outdoor trips need relevant gear
- 25-35 items total, no more`;

export async function POST(request) {
  try {
    const { profile, activities, destination, niche } = await request.json();

    if (!profile || !destination) {
      return Response.json({ error: "Missing profile or destination" }, { status: 400 });
    }

    const kidsInfo = (profile.kids ?? []).map((k, i) => {
      const age = k.age ?? (k.birth_date ? Math.floor((Date.now() - new Date(k.birth_date)) / (365.25 * 24 * 60 * 60 * 1000)) : 0);
      return `Child ${i + 1}: age ${age}`;
    }).join(", ");

    const activityTypes = [...new Set((activities ?? []).map(a => a.type))].join(", ");
    const hasOutdoor = niche === "outdoor" || (activities ?? []).some(a => ["hike", "outdoors"].includes(a.type));
    const hasBeach = destination.toLowerCase().includes("beach") || (activities ?? []).some(a => a.type === "outdoors");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content:
          `Generate a family packing list for:\n` +
          `Destination: ${destination}\n` +
          `Trip length: ${profile.trip_length_days ?? "?"} days\n` +
          `Adults: ${profile.adults ?? 2}\n` +
          `Children: ${kidsInfo || "none specified"}\n` +
          `Activity types: ${activityTypes || "general sightseeing"}\n` +
          `Outdoor trip: ${hasOutdoor ? "yes" : "no"}\n` +
          `Beach activities: ${hasBeach ? "yes" : "no"}\n` +
          `Respond with ONLY a JSON array starting with [ and ending with ]. No other text.`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    if (!text) throw new Error("Empty response from AI");

    let items;

    // Strategy 1: slice from first [ to last ] and parse
    const start = text.indexOf("[");
    const end   = text.lastIndexOf("]");
    if (start !== -1 && end > start) {
      try { items = JSON.parse(text.slice(start, end + 1)); } catch { /* fall through */ }
    }

    // Strategy 2: response truncated — close the array at last complete object
    if (!Array.isArray(items) && start !== -1) {
      const lastBrace = text.lastIndexOf("}");
      if (lastBrace > start) {
        try { items = JSON.parse(text.slice(start, lastBrace + 1) + "]"); } catch { /* fall through */ }
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error("Packing list raw response:", text.slice(0, 500));
      throw new Error(`Failed to parse response. Preview: "${text.slice(0, 200)}"`);
    }

    return Response.json({ items, destination });
  } catch (error) {
    console.error("Packing list generation error:", error);
    return Response.json({ error: "Generation failed", detail: error.message }, { status: 500 });
  }
}
