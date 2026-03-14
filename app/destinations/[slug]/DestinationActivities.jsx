"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../../../components/Providers";

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";

const TYPE_EMOJI = {
  attraction: "🎡", museum: "🏛️", park: "🌳", beach: "🏖️",
  zoo: "🦁", aquarium: "🐠", playground: "🛝", hike: "🥾",
  show: "🎭", shopping: "🛍️", food: "🍕", garden: "🌷",
  landmark: "📍", water_park: "💦", theme_park: "🎢", farm: "🐄",
  tour: "🚌", sports: "⚽", custom: "📌",
};

const DURATION_LABELS = {
  full_day: "Full Day", half_day: "Half Day",
  "2-4h": "2–4 hours", "1-2h": "1–2 hours", "<1h": "Under 1 hour",
};

const TAG_LABELS = {
  good_for_toddlers: "Good for Toddlers",
  good_for_big_kids: "Good for Big Kids",
  stroller_friendly: "Stroller Friendly",
  has_bathrooms: "Bathrooms Available",
  has_food: "Food Options",
  shaded_areas: "Shaded Areas",
};

const TAG_EMOJI = {
  good_for_toddlers: "👶",
  good_for_big_kids: "🧒",
  stroller_friendly: "🚼",
  has_bathrooms: "🚻",
  has_food: "🍴",
  shaded_areas: "🌤️",
};

function StarDisplay({ rating, size = 16 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} style={{ color: "#F59E0B", fontSize: size }}>★</span>);
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(<span key={i} style={{ color: "#F59E0B", fontSize: size, opacity: 0.5 }}>★</span>);
    } else {
      stars.push(<span key={i} style={{ color: "#D1CCC6", fontSize: size }}>★</span>);
    }
  }
  return <span style={{ display: "inline-flex", gap: 1 }}>{stars}</span>;
}

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 2, cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ fontSize: 24, color: i <= (hover || value) ? "#F59E0B" : "#D1CCC6", transition: "color .1s" }}>
          ★
        </span>
      ))}
    </span>
  );
}

// Safely extract a displayable string from a value that may be an object with a `display` key
// (the `hours` column is stored as { display: "..." } in Supabase)
function displayStr(val) {
  if (val == null) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.display) return val.display;
  return String(val);
}

export default function DestinationActivities({ activities, city, planUrl }) {
  const router = useRouter();
  const { user } = useSupabase();
  const [selected, setSelected] = useState(new Set(activities.map(a => a.id)));
  const [detail, setDetail] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Review form state
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [formTags, setFormTags] = useState({
    good_for_toddlers: false, good_for_big_kids: false, stroller_friendly: false,
    has_bathrooms: false, has_food: false, shaded_areas: false,
  });

  const resetForm = () => {
    setFormRating(0);
    setFormComment("");
    setFormTags({ good_for_toddlers: false, good_for_big_kids: false, stroller_friendly: false, has_bathrooms: false, has_food: false, shaded_areas: false });
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const fetchReviews = useCallback(async (activityId) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews?activity_id=${activityId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setReviewStats({ count: data.count, avgRating: data.avgRating, tags: data.tags });
      }
    } catch { /* silent */ }
    setReviewsLoading(false);
  }, []);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (detail) {
      setReviews(null);
      setReviewStats(null);
      resetForm();
      fetchReviews(detail.id);
    }
  }, [detail, fetchReviews]);

  const handleSubmitReview = async () => {
    if (!formRating) { setSubmitError("Please select a star rating"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: detail.id,
          star_rating: formRating,
          comment: formComment,
          ...formTags,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Failed to submit"); setSubmitting(false); return; }
      setSubmitSuccess(true);
      // Refresh reviews
      fetchReviews(detail.id);
      resetForm();
      setSubmitSuccess(true);
    } catch { setSubmitError("Network error — please try again"); }
    setSubmitting(false);
  };

  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectAll = () => setSelected(new Set(activities.map(a => a.id)));
  const selectNone = () => setSelected(new Set());
  const allSelected = selected.size === activities.length;

  const handlePlanTrip = () => {
    const names = activities.filter(a => selected.has(a.id)).map(a => a.name);
    try { sessionStorage.setItem("toddlertrip_dest_preselect", JSON.stringify(names)); } catch {}
    router.push(planUrl);
  };

  return (
    <>
      {/* Select controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, margin: 0 }}>
          Top Family Activities
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: STONE }}>{selected.size} of {activities.length} selected</span>
          <button onClick={allSelected ? selectNone : selectAll}
            style={{ fontSize: 11, fontWeight: 800, color: OCEAN, background: "#E6F6F8", border: `1.5px solid ${OCEAN}33`, borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
      </div>

      {/* Activity grid */}
      <div className="act-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {activities.map((a) => {
          const emoji = TYPE_EMOJI[a.type] || TYPE_EMOJI.custom;
          const isSelected = selected.has(a.id);
          return (
            <div key={a.id} className="act-card"
              onClick={() => setDetail(a)}
              style={{
                background: "#fff", borderRadius: 14, padding: "18px 16px",
                border: `2px solid ${isSelected ? OCEAN : MIST}`,
                cursor: "pointer", position: "relative",
                boxShadow: isSelected ? `0 2px 10px ${OCEAN}18` : "none",
              }}>
              {/* Checkbox */}
              <div
                onClick={(e) => { e.stopPropagation(); toggleOne(a.id); }}
                style={{
                  position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${isSelected ? OCEAN : "#D1CCC6"}`,
                  background: isSelected ? OCEAN : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 4, lineHeight: 1.3 }}>{a.name}</h3>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    {a.duration_category && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "2px 7px" }}>
                        {DURATION_LABELS[a.duration_category] || a.duration_category}
                      </span>
                    )}
                    {a.age_min != null && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#FAF5FF", color: "#7C3AED", borderRadius: 6, padding: "2px 7px" }}>
                        Ages {a.age_min}–{a.age_max ?? "12"}+
                      </span>
                    )}
                    {a.stroller_accessible && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#F0FAF4", color: "#2D8A4E", borderRadius: 6, padding: "2px 7px" }}>
                        Stroller OK
                      </span>
                    )}
                  </div>
                  {a.ai_tips && (
                    <p style={{ fontSize: 12, color: STONE, lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
                      {a.ai_tips.length > 120 ? a.ai_tips.slice(0, 120) + "..." : a.ai_tips}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan CTA with selected count */}
      <div style={{ textAlign: "center", marginTop: 28 }}>
        <button onClick={handlePlanTrip} className="dest-cta" disabled={selected.size === 0}
          style={{ opacity: selected.size === 0 ? 0.5 : 1 }}>
          ✨ Plan a Trip to {city} ({selected.size} activities)
        </button>
      </div>

      {/* ── Detail Modal ── */}
      {detail && (
        <div onClick={() => setDetail(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, padding: "28px 26px", maxWidth: 580, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.2)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{TYPE_EMOJI[detail.type] || "📌"}</span>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, margin: 0, lineHeight: 1.3 }}>{detail.name}</h3>
                  {reviewStats && reviewStats.count > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <StarDisplay rating={reviewStats.avgRating} size={14} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{reviewStats.avgRating}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: STONE }}>({reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""})</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: STONE, cursor: "pointer", flexShrink: 0 }}>&times;</button>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "3px 9px" }}>{detail.type}</span>
              {detail.duration_category && <span style={{ fontSize: 11, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "3px 9px" }}>{DURATION_LABELS[detail.duration_category] || detail.duration_category}</span>}
              {detail.age_min != null && <span style={{ fontSize: 11, fontWeight: 700, background: "#FAF5FF", color: "#7C3AED", borderRadius: 6, padding: "3px 9px" }}>Ages {detail.age_min}–{detail.age_max ?? "12"}+</span>}
              {detail.stroller_accessible && <span style={{ fontSize: 11, fontWeight: 700, background: "#F0FAF4", color: "#2D8A4E", borderRadius: 6, padding: "3px 9px" }}>Stroller Accessible</span>}
              {detail.food_onsite && <span style={{ fontSize: 11, fontWeight: 700, background: "#FFF9F0", color: "#B45309", borderRadius: 6, padding: "3px 9px" }}>Food On-Site</span>}
            </div>

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: 13, marginBottom: 16 }}>
              {displayStr(detail.address) && <><span style={{ fontWeight: 800, color: INK }}>Location</span><span style={{ color: STONE, fontWeight: 600 }}>{displayStr(detail.address)}</span></>}
              {displayStr(detail.hours) && <><span style={{ fontWeight: 800, color: INK }}>Hours</span><span style={{ color: STONE, fontWeight: 600 }}>{displayStr(detail.hours)}</span></>}
              {detail.admission_adult_usd != null && (
                <><span style={{ fontWeight: 800, color: INK }}>Admission</span>
                <span style={{ color: STONE, fontWeight: 600 }}>
                  {detail.admission_adult_usd === 0 ? "Free" : `$${detail.admission_adult_usd}/adult`}
                  {detail.admission_child_usd > 0 ? ` · $${detail.admission_child_usd}/child` : ""}
                </span></>
              )}
              {detail.duration_mins_typical && <><span style={{ fontWeight: 800, color: INK }}>Typical Duration</span><span style={{ color: STONE, fontWeight: 600 }}>{detail.duration_mins_typical} min</span></>}
            </div>

            {/* Tips / Description */}
            {detail.ai_tips && (
              <div style={{ background: "#FAFAF7", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: OCEAN, marginBottom: 6 }}>Tips</div>
                <p style={{ fontSize: 13, color: STONE, fontWeight: 600, lineHeight: 1.7, margin: 0 }}>{detail.ai_tips}</p>
              </div>
            )}

            {/* Tags list */}
            {detail.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {detail.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 700, color: STONE, background: `${MIST}`, borderRadius: 10, padding: "3px 8px" }}>#{t}</span>
                ))}
              </div>
            )}

            {/* Family-Friendly Tags from Reviews */}
            {reviewStats && reviewStats.count > 0 && (
              <div style={{ background: "#F0FAF4", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#2D8A4E", marginBottom: 10 }}>
                  Family-Friendly Info (from {reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""})
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(TAG_LABELS).map(([key, label]) => {
                    const pct = reviewStats.tags[key] || 0;
                    if (pct === 0) return null;
                    return (
                      <span key={key} style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "4px 10px",
                        background: pct >= 70 ? "#DCFCE7" : pct >= 40 ? "#FEF9C3" : "#F3F4F6",
                        color: pct >= 70 ? "#166534" : pct >= 40 ? "#854D0E" : STONE,
                      }}>
                        {TAG_EMOJI[key]} {label} ({pct}%)
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button onClick={() => { toggleOne(detail.id); }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${selected.has(detail.id) ? OCEAN : MIST}`, background: selected.has(detail.id) ? "#E6F6F8" : "#fff", color: selected.has(detail.id) ? OCEAN : STONE, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {selected.has(detail.id) ? "✓ Selected" : "Select Activity"}
              </button>
              {detail.booking_url && (
                <a href={detail.booking_url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`, color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center" }}>
                  Book &rarr;
                </a>
              )}
            </div>

            {/* ── Reviews Section ── */}
            <div style={{ borderTop: `1px solid ${MIST}`, paddingTop: 20 }}>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: INK, margin: "0 0 16px" }}>
                Reviews & Family Tips
              </h4>

              {/* Write a Review */}
              {user ? (
                <div style={{ background: "#FAFAF7", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 10 }}>
                    Share your experience
                  </div>

                  {submitSuccess ? (
                    <div style={{ padding: "12px 16px", background: "#DCFCE7", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#166534" }}>
                      Thanks for your review!
                    </div>
                  ) : (
                    <>
                      {/* Star rating */}
                      <div style={{ marginBottom: 12 }}>
                        <StarInput value={formRating} onChange={setFormRating} />
                      </div>

                      {/* Comment */}
                      <textarea
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        placeholder="How was this activity with your family? Any tips for other parents?"
                        rows={3}
                        style={{
                          width: "100%", borderRadius: 8, border: `1.5px solid ${MIST}`, padding: "10px 12px",
                          fontSize: 13, fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: INK,
                          resize: "vertical", boxSizing: "border-box",
                        }}
                      />

                      {/* Family tags */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, marginBottom: 12 }}>
                        {Object.entries(TAG_LABELS).map(([key, label]) => (
                          <button key={key}
                            onClick={() => setFormTags(t => ({ ...t, [key]: !t[key] }))}
                            style={{
                              fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                              border: `1.5px solid ${formTags[key] ? OCEAN : MIST}`,
                              background: formTags[key] ? "#E6F6F8" : "#fff",
                              color: formTags[key] ? OCEAN : STONE,
                            }}>
                            {TAG_EMOJI[key]} {label}
                          </button>
                        ))}
                      </div>

                      {submitError && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 8 }}>{submitError}</div>
                      )}

                      <button onClick={handleSubmitReview} disabled={submitting}
                        style={{
                          padding: "9px 20px", borderRadius: 10, border: "none",
                          background: submitting ? STONE : `linear-gradient(135deg, ${OCEAN}, #0EA5C9)`,
                          color: "#fff", fontSize: 13, fontWeight: 800, cursor: submitting ? "default" : "pointer",
                        }}>
                        {submitting ? "Posting..." : "Post Review"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ background: "#FAFAF7", borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "center" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: STONE, margin: 0 }}>
                    <a href="/plan" style={{ color: OCEAN, fontWeight: 800, textDecoration: "none" }}>Sign in</a> to share your review and tips for other families.
                  </p>
                </div>
              )}

              {/* Review List */}
              {reviewsLoading && (
                <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, fontWeight: 600, color: STONE }}>
                  Loading reviews...
                </div>
              )}

              {reviews && reviews.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, fontWeight: 600, color: STONE }}>
                  No reviews yet — be the first to share your experience!
                </div>
              )}

              {reviews && reviews.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {reviews.map((r) => (
                    <div key={r.id} style={{ background: "#fff", border: `1px solid ${MIST}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{r.display_name}</span>
                          <StarDisplay rating={r.star_rating} size={12} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: STONE }}>
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {r.comment && (
                        <p style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.6, margin: "0 0 8px" }}>{r.comment}</p>
                      )}

                      {/* Review tags */}
                      {Object.keys(TAG_LABELS).some(k => r[k]) && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {Object.entries(TAG_LABELS).map(([key, label]) =>
                            r[key] ? (
                              <span key={key} style={{ fontSize: 10, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "2px 7px" }}>
                                {TAG_EMOJI[key]} {label}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
