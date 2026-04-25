import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase/server";
import { getProfileById, type AppProfile } from "./users";

export type CurrentUser = AppProfile;

/**
 * Get the currently logged-in user's profile.
 * Returns null kalau tidak login atau profile tidak ada di DB.
 *
 * Side-effect penting: kalau auth.users ada tapi profiles tidak ada
 * (kasus: user sign-up Google tanpa di-invite admin), kita PAKSA sign-out
 * supaya session-nya bersih dan user mendarat di /login dengan pesan jelas.
 *
 * cache() mencegah double-fetch dalam 1 request (tiap server component
 * panggilan getCurrentUser() pakai hasil yang sama).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getProfileById(user.id);

  if (!profile) {
    // Auth user ada tapi tidak ter-invite. Bersihkan sesi.
    try {
      await supabase.auth.signOut();
    } catch {
      // best effort
    }
    return null;
  }

  return profile;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.isActive) throw new Error("ACCOUNT_INACTIVE");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
