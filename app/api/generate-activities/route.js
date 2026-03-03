import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  "You are a family travel expert. When given a city, children's ages, and trip length, generate 12-16 activities. " +
  "CRITICAL: Respond with ONLY a valid JSON array, no markdown, no explanation. " +
  'Each object: {"id":"snake_id","name":"Name","type":"attraction"|"park"|"outdoors"|"culture"|"museum"|"food"|"entertainment",' +
  '"hours":"human readable hours","notes":"practical tips for parents","location":"address","age_range":"min-max",' +
  '"duration_mins":number,"affiliate":"url"}. ' +
  "Rules: real places only, stroller-friendly, mix indoor/outdoor, realistic durations.";

export async function POST(request) {
  try {
    const { destination, kids, trip_length_days } = await request.json();

    if (!destination || !kids?.length) {
      return Response.json({ error: "Missing destination or kids" }, { status: 400 });
    }

    const ages = kids.map((k) => k.age).join(", ");
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate 12-16 family activities for: ${destination}. Children ages: ${ages}. Trip: ${trip_length_days} days. ONLY JSON array.`,
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return Response.json(parsed);
  } catch (error) {
    console.error("Activity generation error:", error);
    return Response.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
