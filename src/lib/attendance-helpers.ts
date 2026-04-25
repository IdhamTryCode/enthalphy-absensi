// Pure helpers + types untuk data attendance.
// File ini SAFE di-import dari client components (tidak ada `server-only` /
// `db` import).
import type { AttendanceRow } from "./attendance-types";

export type DailySummary = {
  userId: string;
  email: string;
  nama: string;
  divisionName: string | null;
  tanggal: string;
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
};

/** Group attendance rows by user × tanggal. Sorted: terbaru → nama A-Z. */
export function summarizeByUserAndDate(rows: AttendanceRow[]): DailySummary[] {
  const byKey = new Map<string, DailySummary>();
  for (const r of rows) {
    const key = `${r.userId}|${r.tanggal}`;
    const existing = byKey.get(key) ?? {
      userId: r.userId,
      email: r.email,
      nama: r.nama,
      divisionName: r.divisionName,
      tanggal: r.tanggal,
      checkIn: null,
      checkOut: null,
    };
    if (r.status === "Masuk" && !existing.checkIn) existing.checkIn = r;
    else if (r.status === "Pulang" && !existing.checkOut) existing.checkOut = r;
    byKey.set(key, existing);
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
    return a.nama.localeCompare(b.nama);
  });
}

export type DaySummary = {
  tanggal: string;
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
};

/** Group attendance rows by tanggal only (single-user context). Sorted desc. */
export function summarizeByDate(rows: AttendanceRow[]): DaySummary[] {
  const byDate = new Map<string, DaySummary>();
  for (const r of rows) {
    const existing = byDate.get(r.tanggal) ?? {
      tanggal: r.tanggal,
      checkIn: null,
      checkOut: null,
    };
    if (r.status === "Masuk" && !existing.checkIn) existing.checkIn = r;
    else if (r.status === "Pulang" && !existing.checkOut) existing.checkOut = r;
    byDate.set(r.tanggal, existing);
  }
  return [...byDate.values()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
