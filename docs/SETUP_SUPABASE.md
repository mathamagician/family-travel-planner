# Supabase Setup Guide
*Complete these steps before running the app with auth/database features.*

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. Click **New Project**
3. Name it: `family-travel-planner`
4. Choose a strong database password (save it somewhere safe)
5. Select region: **US East (N. Virginia)** or closest to you
6. Click **Create new project** — takes ~2 minutes to provision

---

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see: `Success. No rows returned.`

---

## Step 3: Enable Google OAuth (optional but recommended)

1. In Supabase dashboard → **Authentication** → **Providers**
2. Toggle **Google** to enabled
3. You'll need a Google OAuth Client ID and Secret:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project (or use existing)
   - Enable the **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret back into Supabase
4. In Supabase → Authentication → **URL Configuration**:
   - Site URL: `https://family-travel-planner.vercel.app` (or `http://localhost:3000` for dev)
   - Add redirect URL: `http://localhost:3000/**`

---

## Step 4: Get Your API Keys

1. In Supabase dashboard → **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click reveal) → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 5: Update Local .env.local

```bash
# In your project root, open .env.local and add:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
INTERNAL_API_SECRET=any-long-random-string-you-choose
```

**Generate a random secret:**
```bash
openssl rand -hex 32
# or just type a long random string
```

---

## Step 6: Add Keys to Vercel (Production)

1. Go to [vercel.com](https://vercel.com) → your `family-travel-planner` project
2. **Settings** → **Environment Variables**
3. Add all four variables from Step 5 (same values)
4. Click **Save** — Vercel will redeploy automatically

---

## Step 7: Test Locally

```bash
npm run dev
# Go to http://localhost:3000
# Click "Sign In" in the top right
# Try creating an account with email/password
# Build a trip and click "Save Trip"
```

---

## Troubleshooting

**"Invalid API key"** — Double-check NEXT_PUBLIC_SUPABASE_URL has no trailing slash

**Auth redirect not working** — Make sure `http://localhost:3000/**` is in Supabase's allowed redirect URLs

**RLS errors in console** — The schema sets up Row Level Security. If you see "new row violates RLS policy", the user isn't authenticated properly

**Google OAuth not working** — Verify the redirect URI in Google Cloud Console matches Supabase exactly: `https://[project-id].supabase.co/auth/v1/callback`

---

## Schema Reference

See `supabase/schema.sql` for the full database schema with comments.
See `docs/architecture.md` for the full architecture document.
