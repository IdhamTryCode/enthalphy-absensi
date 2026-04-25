"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Listener untuk auth state changes — kalau session expired/SIGNED_OUT,
 * auto-redirect ke /login. Mount di layout halaman authenticated.
 */
export function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          toast.error("Sesi berakhir. Silakan login kembali.");
          router.push("/login");
          router.refresh();
        }
        if (event === "TOKEN_REFRESHED") {
          // Refresh server components biar dapat data dengan token baru
          router.refresh();
        }
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
