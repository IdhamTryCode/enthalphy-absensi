import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk Client Components.
 * Aman di-expose ke browser karena pakai anon key + RLS.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
