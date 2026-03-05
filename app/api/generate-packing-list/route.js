import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a family travel packing expert specializing in trips with young children.

Generate a practical, comprehensive packing checklist based on the trip details provided.

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation.

Each item object:
{
  "id": "unique_snake_id",
  "category": "one of: documents|clothing|baby_gear|toiletries|health_safety|activities|snacks|tech|outdoor|misc",
  "name": "Item name",
  "quantity": <number or null for 'as needed'>,
  "quantity_note": "<e.g. '1 per day', '2 per child', null>",
  "notes": "<practical tip or why it's important, null if obvious>",
  "essential": true | false,
  "age_relevant": true | false,
  "affiliate_search": "<short Amazon/REI search query for this item, null if no purchase needed>",
  "affiliate_url": null
}

PACKING PHILOSOPHY:
- Group items by category for easy packing
- Mark truly essential items (the ones you cannot forget)
- For each child's age group, include age-appropriate items:
  - Infants (0-1): diapers, formula/nursing supplies, portable crib, carrier
  - Toddlers (1-3): pull-ups or diapers, sippy cups, portacrib, baby monitor, toddler utensils
  - Preschool (3-5): sun protection, water bottle, small backpack
  - School age (5-12): entertainment, headphones, sunscreen
- Include outdoor-specific gear if destination has hiking/camping activities
- Include first aid essentials for families
- Beach trips need different gear than city or mountain trips
- Keep it practical — no "nice to haves" unless they significantly improve family travel`;

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
      max_tokens: 8000,
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
          `Return ONLY a JSON array with all required fields.`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");

    // Extract JSON array even if Claude adds preamble or wraps in code block
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error("No JSON array found in response");
    const items = JSON.parse(arrayMatch[0]);

    if (!Array.isArray(items)) throw new Error("Unexpected response format");

    return Response.json({ items, destination });
  } catch (error) {
    console.error("Packing list generation error:", error);
    return Response.json({ error: "Generation failed", detail: error.message }, { status: 500 });
  }
}
