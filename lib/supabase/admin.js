import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS. NEVER expose to browser.
// Lazy initialization so builds succeed without env vars configured.
let _client = null;

export function getAdminClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}
