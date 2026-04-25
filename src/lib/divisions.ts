import "server-only";
import { db, schema } from "@/db";
import { eq, asc, sql } from "drizzle-orm";

export type Division = {
  id: string;
  name: string;
  memberCount: number;
};

export async function listDivisions(): Promise<Division[]> {
  const rows = await db
    .select({
      id: schema.divisions.id,
      name: schema.divisions.name,
      memberCount: sql<number>`count(${schema.profiles.id})::int`,
    })
    .from(schema.divisions)
    .leftJoin(schema.profiles, eq(schema.profiles.divisionId, schema.divisions.id))
    .groupBy(schema.divisions.id)
    .orderBy(asc(schema.divisions.name));
  return rows;
}

export async function createDivision(name: string): Promise<void> {
  await db.insert(schema.divisions).values({ name: name.trim() });
}

export async function renameDivision(id: string, name: string): Promise<void> {
  await db
    .update(schema.divisions)
    .set({ name: name.trim() })
    .where(eq(schema.divisions.id, id));
}

export async function deleteDivision(id: string): Promise<void> {
  await db.delete(schema.divisions).where(eq(schema.divisions.id, id));
}
