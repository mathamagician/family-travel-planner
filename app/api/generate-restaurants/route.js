import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert family travel planner specializing in finding kid-friendly restaurants for families with young children (ages 0-12).

Your job: Generate a list of 10-14 real, family-friendly restaurants for a destination.

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.

Each restaurant object MUST include ALL of these fields:
{
  "id": "snake_case_unique_id",
  "name": "Official restaurant name",
  "cuisine": "american" | "mexican" | "asian" | "italian" | "seafood" | "pizza" | "bbq" | "mediterranean" | "southern" | "brunch" | "cafe" | "other",
  "meal_type": "lunch" | "dinner" | "both",
  "price_range": "$" | "$$" | "$$$",
  "avg_meal_usd": <number: average cost per person>,
  "hours": "<human readable hours, e.g. Mon-Sat 11am-9pm>",
  "notes": "<2-3 practical tips for parents: highchairs, noise level, kid menu, wait times, best time to go with kids>",
  "location": "<full street address>",
  "kid_menu": true | false,
  "highchairs": true | false,
  "changing_tables": true | false,
  "outdoor_seating": true | false,
  "stroller_friendly": true | false,
  "noise_level": "quiet" | "moderate" | "loud",
  "wait_time_typical": "<e.g. 10-15 min, no wait, 30+ min on weekends>",
  "reservation_recommended": true | false,
  "duration_mins": <number: typical meal duration for families, usually 45-90>,
  "affiliate": "<real website or Google Maps URL>"
}

SELECTION RULES:
- Real restaurants only (must actually exist at this location)
- Mix of cuisine types matching the family's preferences
- At least 3 restaurants must have kid menus
- At least 2 budget-friendly options ($ or $$)
- Include a mix of lunch-only, dinner-only, and both
- At least 2 with outdoor seating (toddlers can be noisy)
- Practical notes focused on what parents with young kids actually need
- Include well-known chains if they're particularly good in that location (e.g., local chains, not just McDonald's)
- Prefer restaurants near popular tourist/activity areas`;

export async function POST(request) {
  try {
    const { destination, kids, cuisine_preferences } = await request.json();

    if (!destination) {
      return Response.json({ error: "Missing destination" }, { status: 400 });
    }

    const ages = (kids ?? []).map((k) => k.age ?? 0).join(", ");
    const cuisines = cuisine_preferences
      ? Object.entries(cuisine_preferences)
          .filter(([k, v]) => v && k !== "none")
          .map(([k]) => k)
          .join(", ")
      : "general mix";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Generate 10-14 family-friendly restaurants for: ${destination}. Children ages: ${ages || "2, 5"}. Cuisine preferences: ${cuisines}. Return ONLY a JSON array with all required fields.`,
      }],
    });

    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const restaurants = JSON.parse(cleaned);

    if (!Array.isArray(restaurants)) throw new Error("Unexpected response format from AI");

    return Response.json({ restaurants, source: "ai" });
  } catch (error) {
    console.error("Restaurant generation error:", error);
    return Response.json({ error: "Generation failed", detail: error.message }, { status: 500 });
  }
}
