"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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

  return (
    <form onSubmit={handleEmailLogin} className="mt-8 space-y-4">
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
  );
}
