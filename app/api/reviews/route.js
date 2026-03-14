import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { getAdminClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews?activity_id=xxx
 * Public — returns all reviews for an activity with aggregate stats.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activity_id");

  if (!activityId) {
    return NextResponse.json({ error: "activity_id is required" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data: reviews, error } = await admin
    .from("activity_reviews")
    .select("id, display_name, star_rating, comment, good_for_toddlers, good_for_big_kids, stroller_friendly, has_bathrooms, has_food, shaded_areas, created_at, user_id")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  // Compute aggregates
  const count = reviews.length;
  const avgRating = count > 0 ? reviews.reduce((s, r) => s + r.star_rating, 0) / count : 0;

  // Tag percentages (only count reviews where tag is true)
  const tags = {};
  for (const key of ["good_for_toddlers", "good_for_big_kids", "stroller_friendly", "has_bathrooms", "has_food", "shaded_areas"]) {
    const yes = reviews.filter(r => r[key]).length;
    tags[key] = count > 0 ? Math.round((yes / count) * 100) : 0;
  }

  return NextResponse.json({ reviews, count, avgRating: Math.round(avgRating * 10) / 10, tags });
}

/**
 * POST /api/reviews
 * Authenticated — creates a review for an activity.
 */
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
  }

  const body = await request.json();
  const { activity_id, star_rating, comment, good_for_toddlers, good_for_big_kids, stroller_friendly, has_bathrooms, has_food, shaded_areas } = body;

  if (!activity_id || !star_rating || star_rating < 1 || star_rating > 5) {
    return NextResponse.json({ error: "activity_id and star_rating (1-5) are required" }, { status: 400 });
  }

  // Get display name from user metadata
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Traveler";

  const { data: review, error } = await supabase
    .from("activity_reviews")
    .insert({
      activity_id,
      user_id: user.id,
      display_name: displayName,
      star_rating,
      comment: comment?.trim() || null,
      good_for_toddlers: !!good_for_toddlers,
      good_for_big_kids: !!good_for_big_kids,
      stroller_friendly: !!stroller_friendly,
      has_bathrooms: !!has_bathrooms,
      has_food: !!has_food,
      shaded_areas: !!shaded_areas,
    })
    .select()
    .single();

  if (error) {
    console.error("Review insert error:", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  return NextResponse.json(review, { status: 201 });
}
