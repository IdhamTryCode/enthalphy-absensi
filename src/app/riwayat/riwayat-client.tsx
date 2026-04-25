"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarRange,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  StickyNote,
  List,
  LayoutGrid,
} from "lucide-react";
import { PhotoLink } from "@/components/photo-thumbnail";
import type { AttendanceRow } from "@/lib/attendance";

export type RiwayatDay = {
  tanggal: string;
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
};

type Stats = {
  onTime: number;
  late: number;
  early: number;
  totalCheckIn: number;
};

const HARI_PENDEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = [
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
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatTanggalID(iso: string): string {
  const [y, m, d] = iso.split("-");
  const hari = HARI_PENDEK[
    new Date(`${iso}T00:00:00+07:00`).getUTCDay()
  ];
  return `${hari}, ${Number(d)} ${BULAN_PENDEK[Number(m) - 1]} ${y}`;
}

export function RiwayatClient({
  days,
  today,
  from,
  stats,
}: {
  days: RiwayatDay[];
  today: string;
  from: string;
  stats: Stats;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <main className="relative min-h-dvh bg-background">
      <div className="bg-brand-gradient pointer-events-none absolute inset-x-0 top-0 h-64" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
        <header className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="size-10 rounded-full">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Riwayatku
            </p>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              Rapor Absensi
            </h1>
          </div>
        </header>

        <section className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bulan ini
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={CheckCircle2} label="Tepat Waktu" value={stats.onTime} tone="success" />
            <StatCard icon={AlertCircle} label="Telat" value={stats.late} tone={stats.late ? "warning" : "neutral"} />
            <StatCard icon={Clock} label="Pulang Cepat" value={stats.early} tone={stats.early ? "warning" : "neutral"} />
            <StatCard icon={TrendingUp} label="Total Check-in" value={stats.totalCheckIn} tone="neutral" />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              30 Hari Terakhir
            </p>
            <div className="flex items-center gap-1 rounded-full border bg-card p-0.5 shadow-sm">
              <ViewToggle
                active={view === "list"}
                onClick={() => setView("list")}
                icon={List}
                label="List"
              />
              <ViewToggle
                active={view === "calendar"}
                onClick={() => setView("calendar")}
                icon={LayoutGrid}
                label="Kalender"
              />
            </div>
          </div>

          {days.length === 0 ? (
            <div className="mt-4 rounded-2xl border bg-card p-10 text-center shadow-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <CalendarRange className="size-5" />
              </div>
              <p className="mt-3 font-medium">Belum ada riwayat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Riwayat absensi 30 hari terakhir akan muncul di sini.
              </p>
            </div>
          ) : view === "list" ? (
            <ListView days={days} />
          ) : (
            <CalendarView days={days} today={today} from={from} />
          )}
        </section>
      </div>
    </main>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          : "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

function ListView({ days }: { days: RiwayatDay[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {days.map((d) => (
        <DayCard key={d.tanggal} day={d} />
      ))}
    </ol>
  );
}

type DayState = "complete" | "late" | "early" | "incomplete" | "absent" | "future" | "weekend";

function classifyDay(day: RiwayatDay | null, isWeekend: boolean, isFuture: boolean): DayState {
  if (isFuture) return "future";
  if (!day) return isWeekend ? "weekend" : "absent";
  if (!day.checkIn) return isWeekend ? "weekend" : "absent";
  if (!day.checkOut) return "incomplete";
  if (day.checkIn.flag === "Telat") return "late";
  if (day.checkOut.flag === "Pulang Cepat") return "early";
  return "complete";
}

const stateClasses: Record<DayState, string> = {
  complete: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  late: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  early: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  incomplete: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
  absent: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  weekend: "bg-muted/40 text-muted-foreground ring-border",
  future: "text-muted-foreground/40",
};

const stateLabel: Record<DayState, string> = {
  complete: "Hadir tepat waktu",
  late: "Telat",
  early: "Pulang cepat",
  incomplete: "Belum check-out",
  absent: "Tidak hadir",
  weekend: "Akhir pekan",
  future: "Belum tiba",
};

function CalendarView({
  days,
  today,
  from,
}: {
  days: RiwayatDay[];
  today: string;
  from: string;
}) {
  const dayMap = useMemo(() => {
    const m = new Map<string, RiwayatDay>();
    for (const d of days) m.set(d.tanggal, d);
    return m;
  }, [days]);

  // Build calendar bulan ini (bulan dari hari ini)
  const [yStr, mStr] = today.split("-");
  const year = Number(yStr);
  const month = Number(mStr); // 1-based
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const daysInMonth = lastDay.getUTCDate();
  // ISO Monday-start: Sunday=0 -> 6, Monday=1 -> 0
  const startWeekday = (firstDay.getUTCDay() + 6) % 7;

  const cells: Array<{ iso: string | null; dayNum: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ iso: null, dayNum: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, dayNum: d });
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, dayNum: null });

  const todayIso = today;
  const fromIso = from;

  return (
    <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-center text-sm font-semibold">
        {BULAN[month - 1]} {year}
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((h) => (
          <div key={h} className="py-1">
            {h}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.iso) return <div key={idx} />;
          const date = new Date(`${cell.iso}T00:00:00Z`);
          const weekday = date.getUTCDay();
          const isWeekend = weekday === 0 || weekday === 6;
          const isFuture = cell.iso > todayIso;
          const isOutOfRange = cell.iso < fromIso;
          const day = dayMap.get(cell.iso) ?? null;
          const state = isOutOfRange
            ? "future"
            : classifyDay(day, isWeekend, isFuture);
          const isToday = cell.iso === todayIso;

          return (
            <div
              key={idx}
              title={`${cell.iso} — ${stateLabel[state]}`}
              className={`group relative flex aspect-square items-center justify-center rounded-md text-xs font-medium ring-1 ring-inset ${stateClasses[state]} ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              {cell.dayNum}
            </div>
          );
        })}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] sm:grid-cols-3">
        <Legend tone="complete" label="Tepat waktu" />
        <Legend tone="late" label="Telat / Pulang cepat" />
        <Legend tone="incomplete" label="Belum check-out" />
        <Legend tone="absent" label="Tidak hadir" />
        <Legend tone="weekend" label="Akhir pekan" />
      </ul>
    </div>
  );
}

function Legend({ tone, label }: { tone: DayState; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`size-3 rounded-sm ring-1 ring-inset ${stateClasses[tone]}`} />
      <span className="text-muted-foreground">{label}</span>
    </li>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "success" | "warning" | "neutral";
}) {
  const colorClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <span className={`flex size-8 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function DayCard({ day }: { day: RiwayatDay }) {
  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{formatTanggalID(day.tanggal)}</p>
        {!day.checkIn ? (
          <Badge variant="outline" className="h-5 text-[10px]">
            Tidak ada
          </Badge>
        ) : !day.checkOut ? (
          <Badge variant="outline" className="h-5 text-[10px]">
            Tidak check-out
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatusBlock label="Masuk" row={day.checkIn} />
        <StatusBlock label="Pulang" row={day.checkOut} />
      </div>
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
        <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-sm">—</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {row.flag ? (
          <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
            {row.flag}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-base font-semibold tabular-nums">{row.jam}</p>
      <p
        className="mt-1 flex items-start gap-1 text-[10px] text-muted-foreground"
        title={row.alamat}
      >
        <MapPin className="mt-0.5 size-2.5 shrink-0" />
        <span className="line-clamp-1">{row.alamat}</span>
      </p>
      {row.note ? (
        <p className="mt-1 flex items-start gap-1 text-[10px]">
          <StickyNote className="mt-0.5 size-2.5 shrink-0 text-primary" />
          <span className="line-clamp-2">{row.note}</span>
        </p>
      ) : null}
      <div className="mt-1.5">
        <PhotoLink url={row.linkFoto} alt={`${label} ${row.jam}`} caption={row.alamat} />
      </div>
    </div>
  );
}
