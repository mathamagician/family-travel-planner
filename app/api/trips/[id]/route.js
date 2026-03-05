import { createClient } from "../../../../lib/supabase/server";

// GET /api/trips/[id] — load a full trip with days and blocks
export async function GET(request, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  // Check if there's a share_token query param for public access
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("token");

  let query = supabase
    .from("trips")
    .select(`
      *,
      trip_days (
        *,
        schedule_blocks (*)
      )
    `)
    .eq("id", id);

  // If share token provided, allow unauthenticated access to public trips
  if (shareToken) {
    query = query.eq("share_token", shareToken);
  } else {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query.single();
  if (error) return Response.json({ error: error.message }, { status: 404 });

  // Sort days and blocks
  if (data.trip_days) {
    data.trip_days.sort((a, b) => a.date.localeCompare(b.date));
    data.trip_days.forEach((day) => {
      if (day.schedule_blocks) {
        day.schedule_blocks.sort((a, b) => a.position - b.position);
      }
    });
  }

  return Response.json(data);
}

// PATCH /api/trips/[id] — update trip metadata or status
export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const { id } = await params;

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await request.json();
  const allowed = ["name", "status", "is_public", "lodging_address"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from("trips")
    .update(filtered)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// DELETE /api/trips/[id] — delete a trip (cascade deletes days + blocks)
export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const { id } = await params;

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
