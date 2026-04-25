"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid")) {
          toast.error("Email atau password salah.");
        } else if (msg.includes("not confirmed")) {
          toast.error("Email belum dikonfirmasi. Cek inbox.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Cek apakah user ini punya profile (= sudah di-invite admin).
      // Defense in depth — server side akan tolak juga via getCurrentUser.
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, is_active")
          .eq("id", data.user.id)
          .maybeSingle();
        if (!profile) {
          await supabase.auth.signOut();
          toast.error(
            "Akun ini belum terdaftar. Hubungi admin untuk minta diundang.",
          );
          return;
        }
        if (!profile.is_active) {
          await supabase.auth.signOut();
          toast.error("Akun nonaktif. Hubungi admin.");
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  async function handleGoogleLogin() {
    setGooglePending(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGooglePending(false);
    }
    // Kalau sukses, browser akan redirect ke Google → kembali ke /auth/callback
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@enthalphy.com"
              className="pl-9"
              disabled={pending}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/lupa-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative mt-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              disabled={pending}
            />
          </div>
        </div>
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Masuk
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        ATAU
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={handleGoogleLogin}
        disabled={googlePending}
      >
        {googlePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleGlyph />
        )}
        Lanjut dengan Google
      </Button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 11.1h-9.17v2.88h5.26c-.23 1.2-.9 2.21-1.93 2.89v2.4h3.13c1.83-1.69 2.88-4.18 2.88-7.16 0-.7-.06-1.37-.17-2.01z"
      />
      <path
        fill="#34A853"
        d="M12.18 21c2.61 0 4.8-.87 6.4-2.36l-3.13-2.4c-.87.58-1.98.93-3.27.93-2.51 0-4.64-1.69-5.4-3.97H3.56v2.48A9 9 0 0 0 12.18 21z"
      />
      <path
        fill="#FBBC05"
        d="M6.78 13.2a5.4 5.4 0 0 1 0-3.4V7.32H3.56a9 9 0 0 0 0 8.36l3.22-2.48z"
      />
      <path
        fill="#EA4335"
        d="M12.18 5.5c1.42 0 2.7.49 3.7 1.44l2.77-2.77A9 9 0 0 0 3.56 7.32L6.78 9.8c.76-2.28 2.89-3.97 5.4-3.97z"
      />
    </svg>
  );
}
