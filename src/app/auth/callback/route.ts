import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProfileById } from "@/lib/users";

const NOT_INVITED_MSG =
  "Akun ini belum terdaftar. Hubungi admin untuk minta diundang ke sistem absensi.";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("exchangeCodeForSession error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    // Cek apakah user ini punya profile (= sudah di-invite admin).
    // Kalau tidak, hapus dari auth.users via admin client (supaya email bisa
    // di-invite ulang tanpa konflik), lalu sign-out dan redirect ke login.
    if (data.user?.id) {
      const profile = await getProfileById(data.user.id);
      if (!profile) {
        try {
          const adminClient = createSupabaseAdminClient();
          await adminClient.auth.admin.deleteUser(data.user.id);
        } catch {
          // best effort — kalau gagal, tetap sign-out
          await supabase.auth.signOut();
        }
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(NOT_INVITED_MSG)}`,
        );
      }
      if (!profile.isActive) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Akun nonaktif. Hubungi admin.")}`,
        );
      }
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
