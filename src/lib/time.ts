import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { env } from "./env";

export const TZ = "Asia/Jakarta";

export function nowWIB(): Date {
  return toZonedTime(new Date(), TZ);
}

export function formatDate(d: Date): string {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd");
}

export function formatTime(d: Date): string {
  return formatInTimeZone(d, TZ, "HH:mm:ss");
}

export function formatTimestamp(d: Date): string {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd HH:mm:ss");
}

export function todayWIB(): string {
  return formatDate(new Date());
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function dateToMinutesWIB(d: Date): number {
  const hhmm = formatInTimeZone(d, TZ, "HH:mm");
  return hhmmToMinutes(hhmm);
}

export type AttendanceFlag = "" | "Telat" | "Pulang Cepat";

export function computeFlag(status: "Masuk" | "Pulang", at: Date): AttendanceFlag {
  const m = dateToMinutesWIB(at);
  if (status === "Masuk") {
    return m > hhmmToMinutes(env.WORK_START) ? "Telat" : "";
  }
  return m < hhmmToMinutes(env.WORK_END) ? "Pulang Cepat" : "";
}

// === Display helpers (locale: Indonesia) ===

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const HARI_PENDEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function weekdayId(iso: string): string {
  return HARI_PENDEK[new Date(`${iso}T00:00:00+07:00`).getUTCDay()];
}

/** "24 Apr" */
export function formatTanggalShortId(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${BULAN_PENDEK[Number(m) - 1]}`;
}

/** "Jum, 24 Apr 2026" */
export function formatTanggalMediumId(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${weekdayId(iso)}, ${Number(d)} ${BULAN_PENDEK[Number(m) - 1]} ${y}`;
}

/** "Jumat, 24 April 2026" — gunakan Intl untuk weekday panjang */
export function formatTanggalLongId(iso: string): string {
  const [y, m, d] = iso.split("-");
  const weekday = new Date(`${iso}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    timeZone: TZ,
  });
  return `${weekday}, ${Number(d)} ${BULAN_PANJANG[Number(m) - 1]} ${y}`;
}

// === Calendar grid helpers ===

/** Mulai bulan (YYYY-MM-01) dari ISO date. */
export function startOfMonth(iso: string): string {
  return iso.slice(0, 7) + "-01";
}

/** Mulai minggu ISO (Senin) dari ISO date. */
export function startOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Render grid kalender 1 bulan (Senin-start ISO). */
export function buildMonthGrid(yearMonth: string): {
  year: number;
  month: number;
  monthName: string;
  cells: Array<{ iso: string | null; dayNum: number | null }>;
} {
  const [yStr, mStr] = yearMonth.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = (firstDay.getUTCDay() + 6) % 7; // Monday=0

  const cells: Array<{ iso: string | null; dayNum: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ iso: null, dayNum: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, dayNum: d });
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, dayNum: null });

  return { year, month, monthName: BULAN_PANJANG[month - 1], cells };
}
