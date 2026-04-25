import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 * Setelah user login Google via Supabase, mereka redirect ke sini dengan ?code=...
 * Kita exchange code → session, lalu redirect ke /dashboard atau ke `next` URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Error dari OAuth provider (mis. user denied consent, email tidak diizinkan, dll)
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");
  if (oauthError) {
    console.error("OAuth provider error:", oauthError, oauthErrorDesc);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthErrorDesc ?? oauthError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("exchangeCodeForSession error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("Auth callback exception:", err);
    const msg = err instanceof Error ? err.message : "Auth callback failed";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`,
    );
  }
}
