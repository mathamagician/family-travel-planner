import { createClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

// OAuth callback handler — Supabase redirects here after Google sign-in
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect home with error param
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
