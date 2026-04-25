import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import {
  getAllAttendance,
  getMonthlyStats,
  summarizeByDate,
} from "@/lib/attendance";
import { todayWIB } from "@/lib/time";
import { RiwayatClient } from "./riwayat-client";

export const dynamic = "force-dynamic";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
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

  return (
    <RiwayatClient
      days={summarizeByDate(rows)}
      today={today}
      from={from}
      stats={{
        onTime: (monthStats.totalCheckIn ?? 0) - (monthStats.totalLate ?? 0),
        late: monthStats.totalLate ?? 0,
        early: monthStats.totalEarly ?? 0,
        totalCheckIn: monthStats.totalCheckIn ?? 0,
      }}
    />
  );
}
