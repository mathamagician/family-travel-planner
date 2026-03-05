import { createClient } from "../../../lib/supabase/server";

// GET /api/profile — get the user's family profile (with children + nap schedules)
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("family_profiles")
    .select(`
      *,
      children (*),
      nap_schedules (*)
    `)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? null);
}

// PUT /api/profile — upsert family profile (create or update)
export async function PUT(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adults_count, preferences, children, nap_schedules } = await request.json();

  // Upsert family profile
  const { data: profile, error: profileError } = await supabase
    .from("family_profiles")
    .upsert({ user_id: user.id, adults_count, preferences }, { onConflict: "user_id" })
    .select()
    .single();

  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  // Replace children — delete old, insert new
  if (children) {
    await supabase.from("children").delete().eq("family_profile_id", profile.id);
    if (children.length > 0) {
      const rows = children.map((c) => ({
        family_profile_id: profile.id,
        name: c.name ?? null,
        birth_date: c.birth_date,
        notes: c.notes ?? null,
      }));
      await supabase.from("children").insert(rows);
    }
  }

  // Replace nap schedules
  if (nap_schedules) {
    await supabase.from("nap_schedules").delete().eq("family_profile_id", profile.id);
    if (nap_schedules.length > 0) {
      const rows = nap_schedules.map((n) => ({
        family_profile_id: profile.id,
        label: n.label ?? "Afternoon Nap",
        typical_start_time: n.typical_start_time ?? n.start ?? "13:00",
        typical_duration_mins: n.typical_duration_mins ?? n.duration ?? 90,
      }));
      await supabase.from("nap_schedules").insert(rows);
    }
  }

  return Response.json({ success: true, profile_id: profile.id });
}
