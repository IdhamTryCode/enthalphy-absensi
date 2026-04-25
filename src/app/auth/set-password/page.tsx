import Image from "next/image";
import { SetPasswordForm } from "./set-password-form";

export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return (
    <main className="bg-brand-gradient flex min-h-dvh items-center justify-center p-6">
      <div className="fade-in w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <Image
          src="/logo.png"
          alt="Enthalphy"
          width={140}
          height={48}
          style={{ width: "auto", height: "auto" }}
          priority
        />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Selamat datang!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Buat password untuk login ke Absensi Enthalphy.
        </p>
        <SetPasswordForm mode="invite" />
      </div>
    </main>
  );
}
