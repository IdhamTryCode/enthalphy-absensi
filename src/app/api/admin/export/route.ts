import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getAllAttendance } from "@/lib/attendance";
import { attendanceToCsv } from "@/lib/export-csv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const userId = searchParams.get("userId") || undefined;
  const divisionId = searchParams.get("divisionId") || undefined;
  const flag = searchParams.get("flag") || undefined;

  let rows = await getAllAttendance({
    fromDate: from,
    toDate: to,
    userId,
    divisionId,
  });

  if (flag === "Telat" || flag === "Pulang Cepat") {
    rows = rows.filter((r) => r.flag === flag);
  }

  const csv = attendanceToCsv(rows);
  const filename = `absensi-${from ?? "all"}-${to ?? "all"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
