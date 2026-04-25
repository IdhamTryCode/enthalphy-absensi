import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck, MapPin, Camera, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { error, message } = await searchParams;

  return (
    <main className="relative flex min-h-dvh flex-col bg-background lg:flex-row">
      <aside className="relative hidden flex-1 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-16 size-[32rem] rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Environergy Consulting
            </span>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-primary-foreground xl:text-5xl">
            Catat kehadiranmu dalam hitungan detik.
          </h2>
          <p className="mt-4 text-balance text-base text-primary-foreground/80">
            Sistem absensi modern untuk tim Enthalphy — terintegrasi dengan
            Google, cepat di mobile, rapi di laptop.
          </p>
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HeroFeature icon={Camera} label="Live camera" />
            <HeroFeature icon={MapPin} label="Geo-tagged" />
            <HeroFeature icon={ShieldCheck} label="Secure" />
          </ul>
        </div>
        <div className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} PT Enthalphy Environergy Consulting
        </div>
      </aside>

      <section className="bg-brand-gradient relative flex flex-1 flex-col items-center justify-center px-6 py-10 lg:bg-none lg:px-16">
        <div className="fade-in w-full max-w-sm">
          <Image
            src="/logo.png"
            alt="Enthalphy"
            width={180}
            height={60}
            priority
            style={{ width: "auto", height: "auto" }}
            className="mx-auto mb-10 lg:hidden"
          />
          <div className="hidden lg:block">
            <Image
              src="/logo.png"
              alt="Enthalphy"
              width={160}
              height={54}
              priority
              style={{ width: "auto", height: "auto" }}
            />
            <p className="mt-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Masuk ke akun
            </p>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-balance text-3xl font-semibold tracking-tight lg:mt-2">
              Absensi Enthalphy
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-balance text-sm leading-relaxed text-muted-foreground lg:mx-0">
              Masuk dengan akun yang sudah didaftarkan oleh admin.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {decodeURIComponent(error)}
            </div>
          ) : null}
          {message ? (
            <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
              {decodeURIComponent(message)}
            </div>
          ) : null}

          <LoginForm />
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground lg:hidden">
          PT Enthalphy Environergy Consulting
        </p>
      </section>
    </main>
  );
}

function HeroFeature({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
      <Icon className="size-4" />
      {label}
    </li>
  );
}
