import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTodayState, type AttendanceRow } from "@/lib/attendance";
import { todayWIB } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  LogIn,
  CheckCircle2,
  Circle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatTanggalID(iso: string): string {
  const [y, m, d] = iso.split("-");
  const hari = new Date(`${iso}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    timeZone: "Asia/Jakarta",
  });
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${hari}, ${Number(d)} ${bulan[Number(m) - 1]} ${y}`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const state = await getTodayState(session.user.email);
  const today = todayWIB();
  const firstName = (session.user.name ?? "").split(" ")[0] || "Kamu";
  const initial = (session.user.name ?? session.user.email).slice(0, 2).toUpperCase();

  return (
    <main className="relative min-h-dvh bg-background">
      <div className="bg-brand-gradient pointer-events-none absolute inset-x-0 top-0 h-80 lg:h-96" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 pt-6 lg:px-10">
        {/* Header — mobile simpel, desktop lebih kaya */}
        <header className="flex items-center justify-between">
          <Image src="/logo.png" alt="Enthalphy" width={110} height={38} priority className="lg:hidden" />
          <Image src="/logo.png" alt="Enthalphy" width={140} height={48} priority className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-full border bg-card/70 py-1 pl-1 pr-4 shadow-sm backdrop-blur-sm lg:flex">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {initial}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-medium">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {session.user.isAdmin ? "Admin" : "Karyawan"}
                </p>
              </div>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-10 rounded-full"
                aria-label="Keluar"
              >
                <LogOut className="size-5" />
              </Button>
            </form>
          </div>
        </header>

        {/* Greeting */}
        <section className="fade-in mt-8 lg:mt-14">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {formatTanggalID(today)}
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight lg:text-5xl">
            Halo, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground lg:text-base">
            {state.nextAction === "Masuk" && "Selamat datang, siap memulai hari?"}
            {state.nextAction === "Pulang" && "Kamu sudah check-in. Selamat bekerja!"}
            {state.nextAction === "Selesai" && "Kerja bagus hari ini. Sampai besok!"}
          </p>
        </section>

        {/* Main grid: stack di mobile, 2-col di desktop */}
        <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-5">
          {/* Timeline card — kiri, 3 kolom di desktop */}
          <section className="slide-up overflow-hidden rounded-2xl border bg-card shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Absensi Hari Ini
              </p>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                WIB
              </span>
            </div>

            <ol className="relative divide-y">
              <TimelineItem
                active={!state.checkIn}
                done={!!state.checkIn}
                label="Check-in"
                icon={LogIn}
                row={state.checkIn}
              />
              <TimelineItem
                active={!!state.checkIn && !state.checkOut}
                done={!!state.checkOut}
                label="Check-out"
                icon={LogOut}
                row={state.checkOut}
              />
            </ol>
          </section>

          {/* Action + admin — kanan, 2 kolom di desktop */}
          <aside className="flex flex-col gap-4 lg:col-span-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm lg:flex lg:flex-1 lg:flex-col">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Aksi
                </p>
              </div>

              {state.nextAction === "Selesai" ? (
                <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                    <CheckCircle2 className="size-6 text-primary" />
                  </div>
                  <p className="mt-3 font-medium">Absensi selesai</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hubungi admin jika perlu koreksi.
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex flex-1 flex-col">
                  <Link href={`/absen?status=${state.nextAction}`} className="block">
                    <Button
                      size="lg"
                      className="group h-16 w-full text-base font-medium shadow-md shadow-primary/20"
                    >
                      {state.nextAction === "Masuk"
                        ? "Check-in Sekarang"
                        : "Check-out Sekarang"}
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Absensi terkunci setelah submit.
                  </p>
                </div>
              )}
            </section>

            {session.user.isAdmin ? (
              <Link href="/admin" className="block">
                <div className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rekap Absensi</p>
                    <p className="text-xs text-muted-foreground">Mode admin</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ) : null}
          </aside>
        </div>

        <p className="mt-16 text-center text-[11px] text-muted-foreground">
          PT Enthalphy Environergy Consulting
        </p>
      </div>
    </main>
  );
}

function TimelineItem({
  active,
  done,
  label,
  icon: Icon,
  row,
}: {
  active: boolean;
  done: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  row: AttendanceRow | null;
}) {
  return (
    <li className="flex gap-4 p-5 lg:p-6">
      <div className="flex flex-col items-center">
        <span
          className={
            done
              ? "flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground lg:size-12"
              : active
                ? "flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-primary lg:size-12"
                : "flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-background text-muted-foreground lg:size-12"
          }
        >
          {done ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          {row?.flag ? (
            <Badge variant="destructive" className="h-5 text-[10px]">
              {row.flag}
            </Badge>
          ) : null}
        </div>

        {row ? (
          <>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight lg:text-3xl">
              {row.jam}
            </p>
            <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">{row.alamat}</span>
            </div>
          </>
        ) : (
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="size-3" />
            {active ? "Menunggu…" : "Belum tersedia"}
          </p>
        )}
      </div>
    </li>
  );
}
