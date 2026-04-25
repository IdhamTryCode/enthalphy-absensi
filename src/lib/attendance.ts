import "server-only";
import { db, schema } from "@/db";
import { and, eq, gte, lte, desc, asc, sql } from "drizzle-orm";
import { todayWIB, formatTime, computeFlag } from "./time";

export type AttendanceStatus = "Masuk" | "Pulang";
export type AttendanceFlag = "Telat" | "Pulang Cepat" | null;
export type NextAction = AttendanceStatus | "Selesai";

export type AttendanceRow = {
  id: string;
  userId: string;
  nama: string;
  email: string;
  divisionName: string | null;
  tanggal: string; // YYYY-MM-DD (WIB)
  jam: string; // HH:mm:ss
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  alamat: string;
  linkFoto: string;
  flag: AttendanceFlag;
  note: string | null;
  timestampAt: Date;
};

export type TodayState = {
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
  nextAction: NextAction;
};

const baseSelect = {
  id: schema.attendance.id,
  userId: schema.attendance.userId,
  nama: schema.profiles.name,
  email: schema.profiles.email,
  divisionName: schema.divisions.name,
  tanggal: schema.attendance.tanggal,
  jam: schema.attendance.jam,
  status: schema.attendance.status,
  latitude: schema.attendance.latitude,
  longitude: schema.attendance.longitude,
  alamat: schema.attendance.alamat,
  linkFoto: schema.attendance.linkFoto,
  flag: schema.attendance.flag,
  note: schema.attendance.note,
  timestampAt: schema.attendance.timestampAt,
};

type RawRow = {
  id: string;
  userId: string;
  nama: string;
  email: string;
  divisionName: string | null;
  tanggal: string;
  jam: string;
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  alamat: string;
  linkFoto: string;
  flag: AttendanceFlag;
  note: string | null;
  timestampAt: Date;
};

function buildRow(row: RawRow): AttendanceRow {
  return row;
}

export async function getTodayStateByUserId(userId: string): Promise<TodayState> {
  const today = todayWIB();
  const rows = await db
    .select(baseSelect)
    .from(schema.attendance)
    .innerJoin(schema.profiles, eq(schema.attendance.userId, schema.profiles.id))
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .where(
      and(
        eq(schema.attendance.userId, userId),
        eq(schema.attendance.tanggal, today),
      ),
    )
    .orderBy(asc(schema.attendance.timestampAt));

  let checkIn: AttendanceRow | null = null;
  let checkOut: AttendanceRow | null = null;
  for (const r of rows) {
    const a = buildRow(r);
    if (a.status === "Masuk" && !checkIn) checkIn = a;
    else if (a.status === "Pulang" && !checkOut) checkOut = a;
  }
  let nextAction: NextAction;
  if (!checkIn) nextAction = "Masuk";
  else if (!checkOut) nextAction = "Pulang";
  else nextAction = "Selesai";

  return { checkIn, checkOut, nextAction };
}

export async function appendAttendance(input: {
  userId: string;
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  alamat: string;
  linkFoto: string;
  note?: string | null;
}): Promise<AttendanceRow> {
  const now = new Date();
  const tanggal = todayWIB();
  const jam = formatTime(now);
  const flag = computeFlag(input.status, now);

  const [inserted] = await db
    .insert(schema.attendance)
    .values({
      userId: input.userId,
      tanggal,
      status: input.status,
      jam,
      latitude: input.latitude,
      longitude: input.longitude,
      alamat: input.alamat,
      linkFoto: input.linkFoto,
      flag: flag === "" ? null : flag,
      note: input.note?.trim() || null,
    })
    .returning({ id: schema.attendance.id });

  // Re-fetch dengan join biar return shape konsisten dengan AttendanceRow
  const [row] = await db
    .select(baseSelect)
    .from(schema.attendance)
    .innerJoin(schema.profiles, eq(schema.attendance.userId, schema.profiles.id))
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .where(eq(schema.attendance.id, inserted.id))
    .limit(1);
  return buildRow(row);
}

export async function getAllAttendance(options?: {
  fromDate?: string;
  toDate?: string;
  userId?: string;
  divisionId?: string;
}): Promise<AttendanceRow[]> {
  const conditions = [];
  if (options?.fromDate) conditions.push(gte(schema.attendance.tanggal, options.fromDate));
  if (options?.toDate) conditions.push(lte(schema.attendance.tanggal, options.toDate));
  if (options?.userId) conditions.push(eq(schema.attendance.userId, options.userId));
  if (options?.divisionId) conditions.push(eq(schema.profiles.divisionId, options.divisionId));

  const rows = await db
    .select(baseSelect)
    .from(schema.attendance)
    .innerJoin(schema.profiles, eq(schema.attendance.userId, schema.profiles.id))
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.attendance.tanggal), asc(schema.profiles.name), asc(schema.attendance.jam));
  return rows.map(buildRow);
}

export async function getAttendanceById(id: string): Promise<AttendanceRow | null> {
  const [row] = await db
    .select(baseSelect)
    .from(schema.attendance)
    .innerJoin(schema.profiles, eq(schema.attendance.userId, schema.profiles.id))
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .where(eq(schema.attendance.id, id))
    .limit(1);
  return row ? buildRow(row) : null;
}

export async function updateAttendance(
  id: string,
  patch: Partial<{
    jam: string;
    note: string | null;
    flag: AttendanceFlag;
    alamat: string;
  }>,
): Promise<void> {
  await db.update(schema.attendance).set(patch).where(eq(schema.attendance.id, id));
}

export async function logAttendanceEdit(input: {
  attendanceId: string;
  editedBy: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason?: string;
}): Promise<void> {
  await db.insert(schema.attendanceEdits).values(input);
}

export async function getAttendanceEditHistory(attendanceId: string) {
  return db
    .select({
      id: schema.attendanceEdits.id,
      field: schema.attendanceEdits.field,
      oldValue: schema.attendanceEdits.oldValue,
      newValue: schema.attendanceEdits.newValue,
      reason: schema.attendanceEdits.reason,
      createdAt: schema.attendanceEdits.createdAt,
      editorName: schema.profiles.name,
      editorEmail: schema.profiles.email,
    })
    .from(schema.attendanceEdits)
    .innerJoin(schema.profiles, eq(schema.attendanceEdits.editedBy, schema.profiles.id))
    .where(eq(schema.attendanceEdits.attendanceId, attendanceId))
    .orderBy(desc(schema.attendanceEdits.createdAt));
}

// Stats untuk rapor pribadi & dashboard admin
export async function getMonthlyStats(input: {
  userId?: string;
  yearMonth: string; // YYYY-MM
}) {
  const from = `${input.yearMonth}-01`;
  // last day of month
  const [y, m] = input.yearMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const to = `${input.yearMonth}-${String(lastDay).padStart(2, "0")}`;

  const conditions = [
    gte(schema.attendance.tanggal, from),
    lte(schema.attendance.tanggal, to),
  ];
  if (input.userId) conditions.push(eq(schema.attendance.userId, input.userId));

  const [stats] = await db
    .select({
      totalRecords: sql<number>`count(*)::int`,
      totalCheckIn: sql<number>`count(*) filter (where ${schema.attendance.status} = 'Masuk')::int`,
      totalCheckOut: sql<number>`count(*) filter (where ${schema.attendance.status} = 'Pulang')::int`,
      totalLate: sql<number>`count(*) filter (where ${schema.attendance.flag} = 'Telat')::int`,
      totalEarly: sql<number>`count(*) filter (where ${schema.attendance.flag} = 'Pulang Cepat')::int`,
    })
    .from(schema.attendance)
    .where(and(...conditions));
  return stats;
}
