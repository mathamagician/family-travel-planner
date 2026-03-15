-- Create restaurants cache table (parallel to activities table)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  cuisine TEXT,
  meal_type TEXT,
  price_range TEXT,
  avg_meal_usd NUMERIC,
  hours TEXT,
  notes TEXT,
  location TEXT,
  kid_menu BOOLEAN DEFAULT false,
  highchairs BOOLEAN DEFAULT false,
  changing_tables BOOLEAN DEFAULT false,
  outdoor_seating BOOLEAN DEFAULT false,
  stroller_friendly BOOLEAN DEFAULT true,
  noise_level TEXT,
  wait_time_typical TEXT,
  reservation_recommended BOOLEAN DEFAULT false,
  duration_mins INTEGER DEFAULT 60,
  affiliate TEXT,
  destination_city TEXT NOT NULL,
  destination_state TEXT,
  destination_country TEXT DEFAULT 'US',
  source TEXT DEFAULT 'ai_generated',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_destination ON restaurants(destination_city, destination_state);
CREATE INDEX IF NOT EXISTS idx_restaurants_source ON restaurants(source);
CREATE INDEX IF NOT EXISTS idx_restaurants_updated ON restaurants(updated_at);

-- RLS: restaurants are world-readable (shared cache, like activities)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants are viewable by everyone"
  ON restaurants FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage restaurants"
  ON restaurants FOR ALL
  USING (auth.role() = 'service_role');
