-- ============================================================
-- Family Travel Planner — Full Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FAMILY & USER TABLES
-- ============================================================

-- One family profile per user (extensible to multiple families later)
CREATE TABLE family_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  home_city         VARCHAR(100),
  home_state        VARCHAR(100),
  home_lat          DECIMAL(9,6),
  home_lng          DECIMAL(9,6),
  adults_count      INTEGER NOT NULL DEFAULT 2,
  preferences       JSONB DEFAULT '{"beach":false,"museums":false,"outdoors":false,"food":false,"hikes":false,"parks":false,"date_night":false}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Children (multiple per family, birth_date not age — age calculated dynamically)
CREATE TABLE children (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE NOT NULL,
  name              VARCHAR(50),
  birth_date        DATE NOT NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Nap schedules (family-level or per-child)
CREATE TABLE nap_schedules (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_profile_id     UUID REFERENCES family_profiles(id) ON DELETE CASCADE NOT NULL,
  child_id              UUID REFERENCES children(id) ON DELETE SET NULL,
  label                 VARCHAR(50) DEFAULT 'Afternoon Nap',
  typical_start_time    TIME NOT NULL,
  typical_duration_mins INTEGER NOT NULL DEFAULT 90,
  active                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITIES TABLE — Core entity, shared across all users
-- ============================================================

CREATE TABLE activities (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id           VARCHAR(255),        -- Google Places ID or TripAdvisor ID for dedup
  name                  VARCHAR(255) NOT NULL,
  type                  VARCHAR(50) NOT NULL DEFAULT 'attraction',
                        -- attraction | park | outdoors | culture | museum | food | entertainment | hike
  niche                 VARCHAR(50),         -- NULL=general, 'outdoor', 'beach', etc.
  destination_city      VARCHAR(100),
  destination_state     VARCHAR(50),
  destination_country   VARCHAR(50) DEFAULT 'US',
  address               TEXT,
  lat                   DECIMAL(9,6),
  lng                   DECIMAL(9,6),

  -- Hours: {monday:{open:"09:00",close:"17:00"}, tuesday:{...}, ...}
  hours                 JSONB,

  -- Duration intelligence — the key to genius scheduling
  duration_mins_typical INTEGER,
  duration_mins_min     INTEGER,
  duration_mins_max     INTEGER,
  duration_category     VARCHAR(20),
                        -- 'full_day' | 'half_day' | '2-4h' | '1-2h' | 'under_1h'

  -- Family suitability
  age_min               INTEGER DEFAULT 0,
  age_max               INTEGER,             -- NULL = all ages
  stroller_accessible   BOOLEAN DEFAULT TRUE,

  -- Admissions & booking
  admission_adult_usd   DECIMAL(10,2),
  admission_child_usd   DECIMAL(10,2),
  admission_notes       TEXT,
  booking_required      BOOLEAN DEFAULT FALSE,
  booking_url           TEXT,

  -- On-site logistics
  food_onsite           BOOLEAN DEFAULT FALSE,
  food_nearby           BOOLEAN DEFAULT TRUE,
  food_notes            TEXT,

  -- Ratings (populated from external APIs or AI estimates)
  tripadvisor_rating    DECIMAL(3,1),
  tripadvisor_id        VARCHAR(100),
  google_rating         DECIMAL(3,1),
  google_place_id       VARCHAR(100),

  -- Monetization
  affiliate_url         TEXT,
  image_url             TEXT,

  -- AI-generated content
  ai_tips               TEXT,
  tags                  JSONB DEFAULT '[]',  -- ['indoor_backup','toddler_favorite','skip_stroller']

  -- Metadata
  source                VARCHAR(50) DEFAULT 'ai_generated',
                        -- 'ai_generated' | 'manual' | 'google_places' | 'tripadvisor'
  verified              BOOLEAN DEFAULT FALSE,
  last_verified_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed age suitability per activity
CREATE TABLE activity_age_suitability (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  age_group   VARCHAR(20) NOT NULL,  -- 'infant' | 'toddler' | 'preschool' | 'school_age' | 'teen'
  suitable    BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT
);

-- ============================================================
-- TRIPS & SCHEDULES
-- ============================================================

CREATE TABLE trips (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_profile_id   UUID REFERENCES family_profiles(id) ON DELETE SET NULL,
  name                VARCHAR(255) NOT NULL,
  destination_name    VARCHAR(255) NOT NULL,
  destination_lat     DECIMAL(9,6),
  destination_lng     DECIMAL(9,6),
  lodging_address     TEXT,
  lodging_lat         DECIMAL(9,6),
  lodging_lng         DECIMAL(9,6),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  niche               VARCHAR(50),           -- NULL | 'outdoor' | etc.
  status              VARCHAR(20) DEFAULT 'planning',
                      -- 'planning' | 'active' | 'completed' | 'archived'

  -- Sharing
  share_token         UUID DEFAULT uuid_generate_v4() UNIQUE,
  is_public           BOOLEAN DEFAULT FALSE,

  -- Snapshots (preserve state at save time for offline/sharing)
  profile_snapshot    JSONB,                 -- family profile at time of save
  activities_snapshot JSONB DEFAULT '[]',    -- activity list used for this trip

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- One row per day of the trip
CREATE TABLE trip_days (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  wake_time   TIME NOT NULL DEFAULT '07:00',
  bed_time    TIME NOT NULL DEFAULT '20:00',
  notes       TEXT,
  UNIQUE(trip_id, date)
);

-- Atomic unit of the calendar — every block on every day
CREATE TABLE schedule_blocks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_day_id   UUID REFERENCES trip_days(id) ON DELETE CASCADE NOT NULL,
  activity_id   UUID REFERENCES activities(id) ON DELETE SET NULL,
  block_type    VARCHAR(20) NOT NULL DEFAULT 'activity',
                -- 'activity' | 'nap' | 'meal' | 'travel' | 'free' | 'custom'
  title         VARCHAR(255) NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  location_name TEXT,
  location_lat  DECIMAL(9,6),
  location_lng  DECIMAL(9,6),
  tags          JSONB DEFAULT '[]',
  notes         TEXT,
  position      INTEGER DEFAULT 0,           -- ordering within the day
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER FEEDBACK — the learning loop
-- ============================================================

CREATE TABLE activity_ratings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_id         UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  trip_id             UUID REFERENCES trips(id) ON DELETE SET NULL,
  rating              INTEGER CHECK (rating >= 1 AND rating <= 5),
  would_return        BOOLEAN,
  kids_ages_at_visit  JSONB,                 -- snapshot: [2, 5] — preserved for insights
  notes               TEXT,
  visited_at          DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PACKING LISTS (Phase 4)
-- ============================================================

CREATE TABLE packing_lists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- items: [{id, category, name, quantity, packed, affiliate_url, notes}]
  items      JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================

CREATE INDEX idx_activities_destination ON activities(destination_city, destination_state);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_niche ON activities(niche);
CREATE INDEX idx_activities_updated ON activities(updated_at);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_share_token ON trips(share_token);
CREATE INDEX idx_trip_days_trip ON trip_days(trip_id);
CREATE INDEX idx_schedule_blocks_day ON schedule_blocks(trip_day_id);
CREATE INDEX idx_activity_ratings_user ON activity_ratings(user_id);
CREATE INDEX idx_activity_ratings_activity ON activity_ratings(activity_id);
CREATE INDEX idx_children_family ON children(family_profile_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamp on edits)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_family_profiles_updated
  BEFORE UPDATE ON family_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trips_updated
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_schedule_blocks_updated
  BEFORE UPDATE ON schedule_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_activities_updated
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_packing_lists_updated
  BEFORE UPDATE ON packing_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — data isolation at DB level
-- ============================================================

ALTER TABLE family_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE children                ENABLE ROW LEVEL SECURITY;
ALTER TABLE nap_schedules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_days               ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_ratings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_age_suitability ENABLE ROW LEVEL SECURITY;

-- family_profiles: users manage only their own
CREATE POLICY "family_profiles_own"
  ON family_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- children: via family_profile ownership
CREATE POLICY "children_own"
  ON children FOR ALL
  USING (family_profile_id IN (
    SELECT id FROM family_profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (family_profile_id IN (
    SELECT id FROM family_profiles WHERE user_id = auth.uid()
  ));

-- nap_schedules: via family_profile ownership
CREATE POLICY "nap_schedules_own"
  ON nap_schedules FOR ALL
  USING (family_profile_id IN (
    SELECT id FROM family_profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (family_profile_id IN (
    SELECT id FROM family_profiles WHERE user_id = auth.uid()
  ));

-- trips: own trips + public trips readable by anyone
CREATE POLICY "trips_own"
  ON trips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trips_public_read"
  ON trips FOR SELECT
  USING (is_public = TRUE);

-- trip_days: via trip ownership (+ public trips)
CREATE POLICY "trip_days_own"
  ON trip_days FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

CREATE POLICY "trip_days_public_read"
  ON trip_days FOR SELECT
  USING (trip_id IN (SELECT id FROM trips WHERE is_public = TRUE));

-- schedule_blocks: via trip ownership (+ public trips)
CREATE POLICY "schedule_blocks_own"
  ON schedule_blocks FOR ALL
  USING (trip_day_id IN (
    SELECT td.id FROM trip_days td
    JOIN trips t ON t.id = td.trip_id
    WHERE t.user_id = auth.uid()
  ))
  WITH CHECK (trip_day_id IN (
    SELECT td.id FROM trip_days td
    JOIN trips t ON t.id = td.trip_id
    WHERE t.user_id = auth.uid()
  ));

CREATE POLICY "schedule_blocks_public_read"
  ON schedule_blocks FOR SELECT
  USING (trip_day_id IN (
    SELECT td.id FROM trip_days td
    JOIN trips t ON t.id = td.trip_id
    WHERE t.is_public = TRUE
  ));

-- activities: readable by everyone, writable only via service role (API server)
CREATE POLICY "activities_public_read"
  ON activities FOR SELECT
  USING (TRUE);

CREATE POLICY "activity_age_suitability_public_read"
  ON activity_age_suitability FOR SELECT
  USING (TRUE);

-- activity_ratings: users manage their own
CREATE POLICY "activity_ratings_own"
  ON activity_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- packing_lists: via trip ownership
CREATE POLICY "packing_lists_own"
  ON packing_lists FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));
