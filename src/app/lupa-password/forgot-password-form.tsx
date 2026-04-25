"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <p className="mt-3 font-medium">Email terkirim</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cek inbox <strong>{email}</strong>. Klik link untuk reset password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative mt-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@enthalphy.com"
            className="pl-9"
            disabled={pending}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Kirim Link Reset
      </Button>
    </form>
  );
}
