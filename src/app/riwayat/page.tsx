import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import {
  getAllAttendance,
  getMonthlyStats,
  type AttendanceRow,
} from "@/lib/attendance";
import { todayWIB } from "@/lib/time";
import { RiwayatClient } from "./riwayat-client";

export const dynamic = "force-dynamic";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export type RiwayatDay = {
  tanggal: string;
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
};

function summarize(rows: AttendanceRow[]): RiwayatDay[] {
  const byDate = new Map<string, RiwayatDay>();
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

export default async function RiwayatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayWIB();
  const yearMonth = today.slice(0, 7);
  const from = daysAgoIso(30);

  const [rows, monthStats] = await Promise.all([
    getAllAttendance({ fromDate: from, toDate: today, userId: user.id }),
    getMonthlyStats({ userId: user.id, yearMonth }),
  ]);

  const days = summarize(rows);
  const onTimeCount = (monthStats.totalCheckIn ?? 0) - (monthStats.totalLate ?? 0);

  return (
    <RiwayatClient
      days={days}
      today={today}
      from={from}
      stats={{
        onTime: onTimeCount,
        late: monthStats.totalLate ?? 0,
        early: monthStats.totalEarly ?? 0,
        totalCheckIn: monthStats.totalCheckIn ?? 0,
      }}
    />
  );
}
