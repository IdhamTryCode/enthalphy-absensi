"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardList,
  Inbox,
  Pencil,
  Search,
  Download,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendanceStatusBlock } from "@/components/attendance-status-block";
import type { AttendanceRow } from "@/lib/attendance-types";
import {
  summarizeByUserAndDate,
  type DailySummary,
} from "@/lib/attendance-helpers";
import { formatTanggalShortId, startOfMonth, startOfWeek } from "@/lib/time";
import type { AppProfile } from "@/lib/users";
import type { Division } from "@/lib/divisions";

type Filters = {
  from: string;
  to: string;
  userId: string;
  divisionId: string;
  flag: string;
};

const PAGE_SIZE = 50;

export function AdminClient({
  initialRows,
  totalRows,
  users,
  divisions,
  filters,
  today,
}: {
  initialRows: AttendanceRow[];
  totalRows: number;
  users: AppProfile[];
  divisions: Division[];
  filters: Filters;
  today: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const summaries = useMemo(
    () => summarizeByUserAndDate(initialRows),
    [initialRows],
  );

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.divisionName ?? "").toLowerCase().includes(q),
    );
  }, [summaries, search]);

  const visibleSummaries = useMemo(
    () => filteredSummaries.slice(0, limit),
    [filteredSummaries, limit],
  );
  const hasMore = filteredSummaries.length > visibleSummaries.length;

  // Stats hitung dari semua filteredSummaries (bukan yang di-paginate),
  // biar angka tidak berubah saat user "Tampilkan lebih"
  const uniqueUsers = new Set(filteredSummaries.map((s) => s.userId)).size;
  const totalLate = filteredSummaries.filter((s) => s.checkIn?.flag === "Telat").length;
  const totalEarly = filteredSummaries.filter((s) => s.checkOut?.flag === "Pulang Cepat").length;

  function applyPreset(preset: "today" | "week" | "month") {
    const params = new URLSearchParams();
    if (preset === "today") {
      params.set("from", today);
      params.set("to", today);
    } else if (preset === "week") {
      params.set("from", startOfWeek(today));
      params.set("to", today);
    } else {
      params.set("from", startOfMonth(today));
      params.set("to", today);
    }
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.divisionId) params.set("divisionId", filters.divisionId);
    if (filters.flag) params.set("flag", filters.flag);
    router.push(`/admin?${params.toString()}`);
  }

  const isPresetActive = (preset: "today" | "week" | "month") => {
    if (preset === "today") return filters.from === today && filters.to === today;
    if (preset === "week")
      return filters.from === startOfWeek(today) && filters.to === today;
    return filters.from === startOfMonth(today) && filters.to === today;
  };

  const exportUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", filters.from);
    p.set("to", filters.to);
    if (filters.userId) p.set("userId", filters.userId);
    if (filters.divisionId) p.set("divisionId", filters.divisionId);
    if (filters.flag) p.set("flag", filters.flag);
    return `/api/admin/export?${p.toString()}`;
  }, [filters]);

  const hasActiveFilter =
    filters.userId ||
    filters.divisionId ||
    filters.flag ||
    filters.from !== today ||
    filters.to !== today;

  return (
    <main className="relative">
      <div className="bg-brand-gradient pointer-events-none absolute inset-x-0 top-0 h-48" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              Rekap Absensi
            </h1>
          </div>
          <a href={exportUrl} download>
            <Button variant="outline" className="shadow-sm">
              <Download className="size-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </a>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-3 lg:gap-4">
          <StatCard icon={Users} label="Karyawan absen" value={uniqueUsers} />
          <StatCard
            icon={ClipboardList}
            label="Total record"
            value={visibleSummaries.length}
          />
          <StatCard
            icon={Inbox}
            label="Telat / Pulang Cepat"
            value={`${totalLate}/${totalEarly}`}
            compact
          />
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          <PresetButton
            active={isPresetActive("today")}
            onClick={() => applyPreset("today")}
          >
            Hari ini
          </PresetButton>
          <PresetButton
            active={isPresetActive("week")}
            onClick={() => applyPreset("week")}
          >
            Minggu ini
          </PresetButton>
          <PresetButton
            active={isPresetActive("month")}
            onClick={() => applyPreset("month")}
          >
            Bulan ini
          </PresetButton>
        </section>

        <form className="mt-3 rounded-2xl border bg-card p-4 shadow-sm lg:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
            <div>
              <Label htmlFor="from" className="text-xs">Dari</Label>
              <Input id="from" name="from" type="date" defaultValue={filters.from} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs">Sampai</Label>
              <Input id="to" name="to" type="date" defaultValue={filters.to} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="userId" className="text-xs">Karyawan</Label>
              <select
                id="userId"
                name="userId"
                defaultValue={filters.userId}
                className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="">Semua karyawan</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="divisionId" className="text-xs">Divisi</Label>
              <select
                id="divisionId"
                name="divisionId"
                defaultValue={filters.divisionId}
                className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="">Semua divisi</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="flag" className="text-xs">Flag</Label>
              <select
                id="flag"
                name="flag"
                defaultValue={filters.flag}
                className="mt-1 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="">Semua flag</option>
                <option value="Telat">Hanya Telat</option>
                <option value="Pulang Cepat">Hanya Pulang Cepat</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" className="flex-1 lg:flex-none lg:min-w-32">
              Terapkan
            </Button>
            {hasActiveFilter ? (
              <Link href="/admin">
                <Button type="button" variant="outline">Reset</Button>
              </Link>
            ) : null}
          </div>
        </form>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau divisi…"
            className="h-10 pl-9"
          />
        </div>

        <section className="mt-4">
          {filteredSummaries.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center shadow-sm lg:p-16">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-5" />
              </div>
              <p className="mt-3 font-medium">Tidak ada data</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Tidak ada hasil pencarian."
                  : "Belum ada absensi pada filter ini."}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                Menampilkan{" "}
                <span className="font-medium text-foreground">
                  {visibleSummaries.length}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-foreground">
                  {filteredSummaries.length}
                </span>{" "}
                hasil
                {totalRows !== filteredSummaries.length
                  ? ` (${totalRows} record mentah)`
                  : ""}
              </p>
              <ul className="grid gap-3 lg:grid-cols-2">
                {visibleSummaries.map((s) => (
                  <SummaryCard key={`${s.userId}-${s.tanggal}`} s={s} />
                ))}
              </ul>
              {hasMore ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setLimit((x) => x + PAGE_SIZE)}
                  >
                    Tampilkan {Math.min(PAGE_SIZE, filteredSummaries.length - visibleSummaries.length)} lagi
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function PresetButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm"
          : "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40"
      }
    >
      <CalendarDays className="size-3" />
      {children}
    </button>
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
      <p className={`mt-3 font-semibold tracking-tight tabular-nums ${compact ? "text-xl" : "text-2xl"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
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
              <p className="truncate text-xs text-muted-foreground">
                {s.divisionName ?? "Tanpa divisi"} · {s.email}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
              {formatTanggalShortId(s.tanggal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <AttendanceStatusBlock
          label="Masuk"
          row={s.checkIn}
          photo="thumbnail"
          footer={s.checkIn ? <KoreksiLink id={s.checkIn.id} /> : null}
        />
        <AttendanceStatusBlock
          label="Pulang"
          row={s.checkOut}
          photo="thumbnail"
          footer={s.checkOut ? <KoreksiLink id={s.checkOut.id} /> : null}
        />
      </div>
    </li>
  );
}

function KoreksiLink({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/koreksi/${id}`}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary hover:underline"
    >
      <Pencil className="size-3" />
      Koreksi
    </Link>
  );
}
