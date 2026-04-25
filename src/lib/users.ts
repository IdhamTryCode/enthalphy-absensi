import "server-only";
import { db, schema } from "@/db";
import { eq, asc, sql } from "drizzle-orm";

export type UserRole = "user" | "admin";
export type InviteStatus = "active" | "pending";

export type AppProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  divisionId: string | null;
  divisionName: string | null;
  inviteStatus: InviteStatus;
  lastSignInAt: Date | null;
  createdAt: Date;
};

function lower(email: string): string {
  return email.trim().toLowerCase();
}

// Subquery dari auth.users untuk dapat email_confirmed_at + last_sign_in_at.
// Kita pakai raw SQL karena auth.users tidak ada di schema Drizzle.
const baseSelect = {
  id: schema.profiles.id,
  email: schema.profiles.email,
  name: schema.profiles.name,
  role: schema.profiles.role,
  isActive: schema.profiles.isActive,
  divisionId: schema.profiles.divisionId,
  divisionName: schema.divisions.name,
  emailConfirmedAt: sql<Date | null>`(SELECT email_confirmed_at FROM auth.users WHERE id = ${schema.profiles.id})`,
  lastSignInAt: sql<Date | null>`(SELECT last_sign_in_at FROM auth.users WHERE id = ${schema.profiles.id})`,
  createdAt: schema.profiles.createdAt,
};

type RawRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  divisionId: string | null;
  divisionName: string | null;
  emailConfirmedAt: Date | null;
  lastSignInAt: Date | null;
  createdAt: Date;
};

function toAppProfile(row: RawRow): AppProfile {
  // Pending: belum konfirmasi email + belum pernah sign-in (invite belum di-claim)
  const inviteStatus: InviteStatus =
    !row.emailConfirmedAt && !row.lastSignInAt ? "pending" : "active";
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
    divisionId: row.divisionId,
    divisionName: row.divisionName,
    inviteStatus,
    lastSignInAt: row.lastSignInAt,
    createdAt: row.createdAt,
  };
}

export async function getProfileById(id: string): Promise<AppProfile | null> {
  const rows = await db
    .select(baseSelect)
    .from(schema.profiles)
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .where(eq(schema.profiles.id, id))
    .limit(1);
  return rows[0] ? toAppProfile(rows[0] as RawRow) : null;
}

export async function getProfileByEmail(email: string): Promise<AppProfile | null> {
  const rows = await db
    .select(baseSelect)
    .from(schema.profiles)
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .where(eq(schema.profiles.email, lower(email)))
    .limit(1);
  return rows[0] ? toAppProfile(rows[0] as RawRow) : null;
}

export async function listProfiles(): Promise<AppProfile[]> {
  const rows = await db
    .select(baseSelect)
    .from(schema.profiles)
    .leftJoin(schema.divisions, eq(schema.profiles.divisionId, schema.divisions.id))
    .orderBy(asc(schema.profiles.name));
  return rows.map((r) => toAppProfile(r as RawRow));
}

export async function updateProfile(
  id: string,
  patch: {
    name?: string;
    role?: UserRole;
    divisionId?: string | null;
    isActive?: boolean;
  },
): Promise<void> {
  await db.update(schema.profiles).set(patch).where(eq(schema.profiles.id, id));
}

export async function countProfiles(): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.profiles);
  return row?.c ?? 0;
}
