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
