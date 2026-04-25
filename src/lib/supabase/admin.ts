import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service_role key) — bypass RLS.
 * HANYA dipakai di server actions yang butuh privilege admin (mis. invite user, set password).
 * JANGAN expose key ini ke browser.
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
