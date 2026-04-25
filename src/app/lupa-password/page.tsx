import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function LupaPasswordPage() {
  return (
    <main className="bg-brand-gradient flex min-h-dvh items-center justify-center p-6">
      <div className="fade-in w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Kembali ke login
        </Link>

        <Image
          src="/logo.png"
          alt="Enthalphy"
          width={140}
          height={48}
          priority
          style={{ width: "auto", height: "auto" }}
          className="mt-4"
        />

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Lupa Password?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masukkan email kamu, kami akan kirim link untuk reset password.
        </p>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
