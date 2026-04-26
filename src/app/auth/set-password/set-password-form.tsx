"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "reset" | "invite";

export function SetPasswordForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);

  // Error dari query params (redirect dari server)
  const authError =
    hashError ??
    searchParams.get("error_description") ??
    searchParams.get("error");

  useEffect(() => {
    const hash = window.location.hash;

    // Cek error dari hash fragment
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const errDesc = params.get("error_description") ?? params.get("error");
      if (errDesc) {
        setHashError(decodeURIComponent(errDesc));
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "USER_UPDATED"
      ) {
        setAuthReady(true);
      }
    });

    // @supabase/ssr tidak otomatis proses hash token — harus exchange manual.
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) setHashError(error.message);
            else setAuthReady(true);
          });
      }
    } else {
      // Tidak ada hash — cek session yang sudah ada (mis. password reset via PKCE)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setAuthReady(true);
      });
    }

    return () => data.subscription.unsubscribe();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak sama.");
      return;
    }
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password berhasil diatur.");
      router.push("/dashboard");
      router.refresh();
    });
  }

  if (authError) {
    return (
      <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Link tidak valid</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {authError}. Coba minta admin untuk mengirim ulang undangan, atau
          gunakan menu &quot;Lupa password&quot; lagi.
        </p>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="mt-8 flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="password">Password Baru</Label>
        <div className="relative mt-1">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className="px-9"
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <div>
        <Label htmlFor="confirm">Konfirmasi Password</Label>
        <div className="relative mt-1">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi password"
            className="pl-9"
            disabled={pending}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {mode === "invite" ? "Aktifkan Akun" : "Simpan Password Baru"}
      </Button>
    </form>
  );
}
