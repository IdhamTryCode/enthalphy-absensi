import { redirect } from "next/navigation";
import { getAllAttendance } from "@/lib/attendance";
import { listProfiles } from "@/lib/users";
import { listDivisions } from "@/lib/divisions";
import { todayWIB } from "@/lib/time";
import { requireAdmin } from "@/lib/current-user";
import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    userId?: string;
    divisionId?: string;
    flag?: string;
  }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const today = todayWIB();
  const from = params.from || today;
  const to = params.to || today;
  const filterUserId = params.userId || "";
  const filterDivisionId = params.divisionId || "";
  const filterFlag = params.flag || "";

  const [rows, users, divisions] = await Promise.all([
    getAllAttendance({
      fromDate: from,
      toDate: to,
      userId: filterUserId || undefined,
      divisionId: filterDivisionId || undefined,
      flag: (filterFlag === "Telat" || filterFlag === "Pulang Cepat") ? filterFlag : undefined,
    }),
    listProfiles(),
    listDivisions(),
  ]);

  const filteredRows = rows;

  return (
    <AdminClient
      initialRows={filteredRows}
      totalRows={filteredRows.length}
      users={users}
      divisions={divisions}
      filters={{
        from,
        to,
        userId: filterUserId,
        divisionId: filterDivisionId,
        flag: filterFlag,
      }}
      today={today}
    />
  );
}
