import Image from "next/image";
import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Camera, Sparkles } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="relative flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Left / Hero */}
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

      {/* Right / Form */}
      <section className="bg-brand-gradient relative flex flex-1 flex-col items-center justify-center px-6 py-10 lg:bg-none lg:px-16">
        <div className="fade-in w-full max-w-sm">
          <Image
            src="/logo.png"
            alt="Enthalphy"
            width={180}
            height={60}
            priority
            className="mx-auto mb-10 lg:hidden"
          />

          <div className="hidden lg:block">
            <Image
              src="/logo.png"
              alt="Enthalphy"
              width={160}
              height={54}
              priority
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
              Catat kehadiranmu dengan cepat. Masuk memakai akun Google
              perusahaan.
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="mt-10"
          >
            <Button
              type="submit"
              className="h-12 w-full text-base shadow-sm"
              size="lg"
            >
              <GoogleGlyph />
              Login dengan Google
            </Button>
          </form>

          <ul className="mt-10 space-y-3 text-sm text-muted-foreground lg:hidden">
            <FeatureItem icon={Camera} label="Foto langsung dari kamera depan" />
            <FeatureItem icon={MapPin} label="Lokasi ter-tag otomatis" />
            <FeatureItem icon={ShieldCheck} label="Aman & terintegrasi Google" />
          </ul>
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

function FeatureItem({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span>{label}</span>
    </li>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M21.35 11.1h-9.17v2.88h5.26c-.23 1.2-.9 2.21-1.93 2.89v2.4h3.13c1.83-1.69 2.88-4.18 2.88-7.16 0-.7-.06-1.37-.17-2.01z"
      />
      <path
        fill="#FFFFFF"
        d="M12.18 21c2.61 0 4.8-.87 6.4-2.36l-3.13-2.4c-.87.58-1.98.93-3.27.93-2.51 0-4.64-1.69-5.4-3.97H3.56v2.48A9 9 0 0 0 12.18 21z"
        opacity=".88"
      />
      <path
        fill="#FFFFFF"
        d="M6.78 13.2a5.4 5.4 0 0 1 0-3.4V7.32H3.56a9 9 0 0 0 0 8.36l3.22-2.48z"
        opacity=".76"
      />
      <path
        fill="#FFFFFF"
        d="M12.18 5.5c1.42 0 2.7.49 3.7 1.44l2.77-2.77A9 9 0 0 0 3.56 7.32L6.78 9.8c.76-2.28 2.89-3.97 5.4-3.97z"
        opacity=".64"
      />
    </svg>
  );
}
