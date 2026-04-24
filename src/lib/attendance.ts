import { getSheets } from "./google";
import { env } from "./env";
import { todayWIB, formatTimestamp, formatDate, formatTime, computeFlag } from "./time";

const TAB = "Attendance";

export type AttendanceStatus = "Masuk" | "Pulang";

export type AttendanceRow = {
  timestamp: string;
  nama: string;
  email: string;
  tanggal: string;
  jam: string;
  status: AttendanceStatus;
  latitude: string;
  longitude: string;
  alamat: string;
  linkFoto: string;
  flag: string;
};

export type NextAction = AttendanceStatus | "Selesai";

export type TodayState = {
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
  nextAction: NextAction;
};

function rangeForRead(): string {
  return `'${TAB}'!A2:K`;
}

function rangeForAppend(): string {
  return `'${TAB}'!A:K`;
}

function rowToAttendance(row: string[]): AttendanceRow {
  return {
    timestamp: row[0] ?? "",
    nama: row[1] ?? "",
    email: row[2] ?? "",
    tanggal: row[3] ?? "",
    jam: row[4] ?? "",
    status: (row[5] as AttendanceStatus) ?? "Masuk",
    latitude: row[6] ?? "",
    longitude: row[7] ?? "",
    alamat: row[8] ?? "",
    linkFoto: row[9] ?? "",
    flag: row[10] ?? "",
  };
}

export async function getTodayState(email: string): Promise<TodayState> {
  if (!env.GOOGLE_SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID tidak di-set");
  }
  const sheets = getSheets();
  const today = todayWIB();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: rangeForRead(),
  });

  const rows = (res.data.values ?? []) as string[][];
  const mine = rows
    .map(rowToAttendance)
    .filter(
      (r) =>
        r.email.toLowerCase() === email.toLowerCase() && r.tanggal === today,
    );

  // Ambil record pertama per status (standar HRIS: sekali saja, yang pertama tercatat)
  let checkIn: AttendanceRow | null = null;
  let checkOut: AttendanceRow | null = null;
  for (const r of mine) {
    if (r.status === "Masuk" && !checkIn) checkIn = r;
    else if (r.status === "Pulang" && !checkOut) checkOut = r;
  }

  let nextAction: NextAction;
  if (!checkIn) nextAction = "Masuk";
  else if (!checkOut) nextAction = "Pulang";
  else nextAction = "Selesai";

  return { checkIn, checkOut, nextAction };
}

export async function getAllAttendance(options?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AttendanceRow[]> {
  if (!env.GOOGLE_SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID tidak di-set");
  }
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: rangeForRead(),
  });
  const rows = (res.data.values ?? []) as string[][];
  let data = rows.map(rowToAttendance).filter((r) => r.email);
  if (options?.fromDate) {
    data = data.filter((r) => r.tanggal >= options.fromDate!);
  }
  if (options?.toDate) {
    data = data.filter((r) => r.tanggal <= options.toDate!);
  }
  return data;
}

export async function appendAttendance(input: {
  nama: string;
  email: string;
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  alamat: string;
  linkFoto: string;
}): Promise<AttendanceRow> {
  if (!env.GOOGLE_SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID tidak di-set");
  }
  const sheets = getSheets();
  const now = new Date();
  const flag = computeFlag(input.status, now);
  const row: string[] = [
    formatTimestamp(now),
    input.nama,
    input.email,
    formatDate(now),
    formatTime(now),
    input.status,
    String(input.latitude),
    String(input.longitude),
    input.alamat,
    input.linkFoto,
    flag,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: rangeForAppend(),
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  return rowToAttendance(row);
}
