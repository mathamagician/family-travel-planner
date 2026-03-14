/**
 * Migration: Create activity_reviews table for public reviews on destination pages.
 * Run: node --env-file=.env.local scripts/migrate-activity-reviews.mjs
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
-- ============================================================
-- ACTIVITY REVIEWS — public reviews on destination pages
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_reviews (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id      UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name     TEXT NOT NULL,
  star_rating      INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  comment          TEXT,
  -- Family-friendly tags (boolean flags)
  good_for_toddlers   BOOLEAN DEFAULT FALSE,
  good_for_big_kids   BOOLEAN DEFAULT FALSE,
  stroller_friendly   BOOLEAN DEFAULT FALSE,
  has_bathrooms       BOOLEAN DEFAULT FALSE,
  has_food            BOOLEAN DEFAULT FALSE,
  shaded_areas        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by activity
CREATE INDEX IF NOT EXISTS idx_activity_reviews_activity_id ON activity_reviews(activity_id);

-- RLS: everyone can read reviews, authenticated users can insert their own
ALTER TABLE activity_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read all reviews (public destination pages)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_reviews_read_all') THEN
    CREATE POLICY activity_reviews_read_all ON activity_reviews FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can insert reviews (user_id must match)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_reviews_insert_own') THEN
    CREATE POLICY activity_reviews_insert_own ON activity_reviews FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_reviews_update_own') THEN
    CREATE POLICY activity_reviews_update_own ON activity_reviews FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_reviews_delete_own') THEN
    CREATE POLICY activity_reviews_delete_own ON activity_reviews FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
`;

async function run() {
  console.log("Running activity_reviews migration...");
  const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).single();
  if (error) {
    // rpc might not exist, try raw SQL via REST
    console.log("rpc exec_sql not available, running via postgres...");
    // Split into individual statements and run each
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 10);
    for (const stmt of statements) {
      const { error: stmtErr } = await supabase.from("_migration_placeholder").select().limit(0);
      // We can't run raw SQL via supabase-js REST API.
      // Print the SQL for manual execution instead.
    }
    console.log("\n⚠️  Cannot run raw SQL via supabase-js REST API.");
    console.log("Please run the following SQL in the Supabase Dashboard SQL Editor:\n");
    console.log(sql);
    console.log("\n📋 Copy the SQL above and paste it into:");
    console.log("   Supabase Dashboard → SQL Editor → New query → Run");
  } else {
    console.log("✅ Migration complete!");
  }
}

run().catch(console.error);
