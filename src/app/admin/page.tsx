import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllAttendance, type AttendanceRow } from "@/lib/attendance";
import { todayWIB } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Users,
  ClipboardList,
  Inbox,
} from "lucide-react";

export const dynamic = "force-dynamic";

type DailySummary = {
  email: string;
  nama: string;
  tanggal: string;
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
  rawCount: number;
};

function summarize(rows: AttendanceRow[]): DailySummary[] {
  const byKey = new Map<string, DailySummary>();
  for (const r of rows) {
    const key = `${r.email.toLowerCase()}|${r.tanggal}`;
    const existing = byKey.get(key) ?? {
      email: r.email,
      nama: r.nama,
      tanggal: r.tanggal,
      checkIn: null,
      checkOut: null,
      rawCount: 0,
    };
    existing.rawCount += 1;
    if (r.status === "Masuk" && !existing.checkIn) existing.checkIn = r;
    else if (r.status === "Pulang" && !existing.checkOut) existing.checkOut = r;
    byKey.set(key, existing);
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
    return a.nama.localeCompare(b.nama);
  });
}

function formatTanggalShort(iso: string): string {
  const [, m, d] = iso.split("-");
  const bulan = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${Number(d)} ${bulan[Number(m) - 1]}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (!session.user.isAdmin) redirect("/dashboard");

  const { from: rawFrom, to: rawTo } = await searchParams;
  const today = todayWIB();
  const from = rawFrom || today;
  const to = rawTo || today;

  const rows = await getAllAttendance({ fromDate: from, toDate: to });
  const summaries = summarize(rows);

  const uniqueUsers = new Set(summaries.map((s) => s.email.toLowerCase())).size;
  const totalLate = summaries.filter((s) => s.checkIn?.flag === "Telat").length;
  const totalEarly = summaries.filter(
    (s) => s.checkOut?.flag === "Pulang Cepat",
  ).length;

  return (
    <main className="relative min-h-dvh bg-background">
      <div className="bg-brand-gradient pointer-events-none absolute inset-x-0 top-0 h-64" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-5 pb-12 pt-6 lg:px-10">
        <header className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Rekap Absensi</h1>
              <p className="text-xs text-muted-foreground">Mode admin</p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-3 gap-3 lg:mt-12 lg:gap-4">
          <StatCard icon={Users} label="Karyawan absen" value={uniqueUsers} />
          <StatCard icon={ClipboardList} label="Total record" value={summaries.length} />
          <StatCard
            icon={Inbox}
            label="Telat / Pulang Cepat"
            value={`${totalLate}/${totalEarly}`}
            compact
          />
        </section>

        <form className="mt-6 rounded-2xl border bg-card p-4 shadow-sm lg:p-5">
          <div className="lg:flex lg:items-end lg:gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Filter tanggal
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:max-w-md">
                <div>
                  <Label htmlFor="from" className="text-xs">
                    Dari
                  </Label>
                  <Input
                    id="from"
                    name="from"
                    type="date"
                    defaultValue={from}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="to" className="text-xs">
                    Sampai
                  </Label>
                  <Input
                    id="to"
                    name="to"
                    type="date"
                    defaultValue={to}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="mt-3 w-full lg:mt-0 lg:w-auto lg:min-w-40">
              Terapkan Filter
            </Button>
          </div>
        </form>

        <section className="mt-6">
          {summaries.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center shadow-sm lg:p-16">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-5" />
              </div>
              <p className="mt-3 font-medium">Tidak ada data</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Belum ada absensi pada rentang tanggal ini.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {summaries.map((s) => (
                <SummaryCard key={`${s.email}-${s.tanggal}`} s={s} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <p
        className={`mt-3 font-semibold tracking-tight tabular-nums ${compact ? "text-xl" : "text-2xl"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SummaryCard({ s }: { s: DailySummary }) {
  const initial = (s.nama || s.email).slice(0, 2).toUpperCase();

  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{s.nama}</p>
              <p className="truncate text-xs text-muted-foreground">{s.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
              {formatTanggalShort(s.tanggal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatusBlock label="Masuk" row={s.checkIn} />
        <StatusBlock label="Pulang" row={s.checkOut} />
      </div>

      {s.rawCount > 2 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {s.rawCount}× percobaan — ditampilkan yang pertama tercatat.
        </p>
      ) : null}
    </li>
  );
}

function StatusBlock({
  label,
  row,
}: {
  label: string;
  row: AttendanceRow | null;
}) {
  if (!row) {
    return (
      <div className="rounded-xl border border-dashed p-3 text-muted-foreground">
        <p className="text-[11px] font-medium uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-sm">—</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {row.flag ? (
          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
            {row.flag}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{row.jam}</p>
      <p
        className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground"
        title={row.alamat}
      >
        <MapPin className="mt-0.5 size-3 shrink-0" />
        <span className="line-clamp-2">{row.alamat}</span>
      </p>
      {row.linkFoto ? (
        <a
          href={row.linkFoto}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <ImageIcon className="size-3" />
          Lihat foto
        </a>
      ) : null}
    </div>
  );
}
