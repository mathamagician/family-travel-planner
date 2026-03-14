-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- Index for fast email lookups (upsert on signup)
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- RLS: only service role can read/write (API route uses admin client)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No public policies — only the service role (admin client) can access
-- This means the table is fully private; only the API route can write to it
