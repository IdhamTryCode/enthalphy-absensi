"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "./current-user";
import {
  updateProfile,
  type UserRole,
} from "./users";
import {
  createDivision,
  renameDivision,
  deleteDivision,
} from "./divisions";
import {
  getAttendanceById,
  type AttendanceFlag,
} from "./attendance";
import { createSupabaseAdminClient } from "./supabase/admin";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

// === Users (invite via Supabase Auth Admin API) ===

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["user", "admin"]).default("user"),
  divisionId: z.string().uuid().optional().nullable(),
});

/**
 * Invite karyawan baru:
 * 1. Buat user di auth.users via Supabase Admin API → Supabase kirim email "set password"
 * 2. Trigger handle_new_auth_user otomatis insert ke profiles dengan role default
 * 3. Update divisionId di profiles (kalau ada)
 *
 * Karyawan klik link di email → set password → bisa login.
 */
export async function actionInviteUser(input: {
  email: string;
  name: string;
  role: UserRole;
  divisionId: string | null;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };

  const supabase = createSupabaseAdminClient();
  const redirectTo =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        // Disimpan di auth.users.raw_user_meta_data → dipakai trigger handle_new_auth_user
        full_name: parsed.data.name,
        role: parsed.data.role,
      },
      redirectTo: `${redirectTo}/auth/set-password`,
    },
  );

  if (error) {
    console.error("Invite failed:", error);
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered")
    ) {
      return { ok: false, error: "Email sudah terdaftar." };
    }
    if (msg.includes("rate") || msg.includes("limit")) {
      return {
        ok: false,
        error:
          "Terlalu banyak undangan dalam waktu singkat. Tunggu beberapa menit.",
      };
    }
    if (msg.includes("invalid") && msg.includes("email")) {
      return { ok: false, error: "Format email tidak valid." };
    }
    return { ok: false, error: "Gagal mengirim undangan. Coba lagi." };
  }

  // Set divisionId via Drizzle (trigger sudah create profile dengan defaults)
  if (data?.user && parsed.data.divisionId) {
    try {
      await updateProfile(data.user.id, {
        divisionId: parsed.data.divisionId,
      });
    } catch (e) {
      console.error("Failed to set division:", e);
    }
  }

  revalidatePath("/admin/users");
  return { ok: true, message: `Undangan dikirim ke ${parsed.data.email}.` };
}

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["user", "admin"]).optional(),
  divisionId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function actionUpdateUser(input: {
  id: string;
  name?: string;
  role?: UserRole;
  divisionId?: string | null;
  isActive?: boolean;
}): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };

  if (parsed.data.id === admin.id && parsed.data.role === "user") {
    return { ok: false, error: "Tidak bisa menurunkan role diri sendiri." };
  }
  if (parsed.data.id === admin.id && parsed.data.isActive === false) {
    return { ok: false, error: "Tidak bisa menonaktifkan akun sendiri." };
  }

  try {
    await updateProfile(parsed.data.id, parsed.data);
    revalidatePath("/admin/users");
    return { ok: true, message: "Perubahan disimpan." };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Gagal menyimpan." };
  }
}

/**
 * Resend invite email — generate link recovery (set password) baru
 * dan kirim ulang ke user.
 */
export async function actionResendInvite(input: {
  userId: string;
  email: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }

  const supabase = createSupabaseAdminClient();
  const redirectTo =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: {
      redirectTo: `${redirectTo}/auth/set-password`,
    },
  });

  if (error) {
    console.error("Resend invite failed:", error);
    return { ok: false, error: "Gagal mengirim ulang undangan." };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: `Undangan dikirim ulang ke ${input.email}.` };
}

export async function actionDeleteUser(id: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }
  if (id === admin.id) {
    return { ok: false, error: "Tidak bisa menghapus akun sendiri." };
  }
  // Hapus dari auth.users → cascade ke profiles
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    console.error(error);
    return { ok: false, error: "Gagal menghapus karyawan." };
  }
  revalidatePath("/admin/users");
  return { ok: true, message: "Karyawan dihapus." };
}

// === Divisions ===

const divisionSchema = z.object({ name: z.string().min(1).max(80) });

export async function actionCreateDivision(name: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }
  const parsed = divisionSchema.safeParse({ name });
  if (!parsed.success) return { ok: false, error: "Nama divisi tidak valid." };
  try {
    await createDivision(parsed.data.name);
    revalidatePath("/admin/divisi");
    revalidatePath("/admin/users");
    return { ok: true, message: "Divisi dibuat." };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("unique")) return { ok: false, error: "Nama divisi sudah ada." };
    return { ok: false, error: "Gagal membuat divisi." };
  }
}

export async function actionRenameDivision(input: { id: string; name: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }
  const parsed = divisionSchema.safeParse({ name: input.name });
  if (!parsed.success) return { ok: false, error: "Nama divisi tidak valid." };
  try {
    await renameDivision(input.id, parsed.data.name);
    revalidatePath("/admin/divisi");
    revalidatePath("/admin/users");
    return { ok: true, message: "Divisi diperbarui." };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("unique")) return { ok: false, error: "Nama divisi sudah ada." };
    return { ok: false, error: "Gagal memperbarui divisi." };
  }
}

export async function actionDeleteDivision(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }
  try {
    await deleteDivision(id);
    revalidatePath("/admin/divisi");
    revalidatePath("/admin/users");
    return { ok: true, message: "Divisi dihapus." };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Gagal menghapus divisi." };
  }
}

// === Koreksi attendance ===

const koreksiSchema = z.object({
  attendanceId: z.string().uuid(),
  jam: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  note: z.string().max(500).optional().nullable(),
  flag: z.enum(["Telat", "Pulang Cepat", "none"]).optional(),
  alamat: z.string().max(500).optional(),
  reason: z.string().min(3).max(500),
});

export async function actionEditAttendance(input: {
  attendanceId: string;
  jam?: string;
  note?: string | null;
  flag?: "Telat" | "Pulang Cepat" | "none";
  alamat?: string;
  reason: string;
}): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }

  const parsed = koreksiSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data koreksi tidak valid." };

  const current = await getAttendanceById(parsed.data.attendanceId);
  if (!current) return { ok: false, error: "Record tidak ditemukan." };

  const patch: Partial<{
    jam: string;
    note: string | null;
    flag: AttendanceFlag;
    alamat: string;
  }> = {};
  const edits: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];

  if (parsed.data.jam && parsed.data.jam !== current.jam) {
    const jamNorm = parsed.data.jam.length === 5 ? `${parsed.data.jam}:00` : parsed.data.jam;
    patch.jam = jamNorm;
    edits.push({ field: "jam", oldValue: current.jam, newValue: jamNorm });
  }
  if (parsed.data.note !== undefined && (parsed.data.note ?? "") !== (current.note ?? "")) {
    patch.note = parsed.data.note?.trim() || null;
    edits.push({ field: "note", oldValue: current.note, newValue: patch.note ?? null });
  }
  if (parsed.data.flag !== undefined) {
    const newFlag: AttendanceFlag = parsed.data.flag === "none" ? null : parsed.data.flag;
    if (newFlag !== current.flag) {
      patch.flag = newFlag;
      edits.push({ field: "flag", oldValue: current.flag ?? null, newValue: newFlag ?? null });
    }
  }
  if (parsed.data.alamat && parsed.data.alamat !== current.alamat) {
    patch.alamat = parsed.data.alamat;
    edits.push({ field: "alamat", oldValue: current.alamat, newValue: parsed.data.alamat });
  }

  if (edits.length === 0) return { ok: false, error: "Tidak ada perubahan." };

  try {
    // Atomic: update attendance + insert audit log dalam 1 transaksi.
    // Kalau salah satu gagal, semua rollback.
    await db.transaction(async (tx) => {
      await tx
        .update(schema.attendance)
        .set(patch)
        .where(eq(schema.attendance.id, parsed.data.attendanceId));

      await tx.insert(schema.attendanceEdits).values(
        edits.map((e) => ({
          attendanceId: parsed.data.attendanceId,
          editedBy: admin.id,
          field: e.field,
          oldValue: e.oldValue,
          newValue: e.newValue,
          reason: parsed.data.reason,
        })),
      );
    });
    revalidatePath("/admin");
    revalidatePath(`/admin/koreksi/${parsed.data.attendanceId}`);
    return { ok: true, message: "Koreksi tersimpan." };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Gagal menyimpan koreksi." };
  }
}

// Helper utility export untuk profiles update (compatibility)
export async function _internal_setDivision(profileId: string, divisionId: string | null) {
  await db
    .update(schema.profiles)
    .set({ divisionId })
    .where(eq(schema.profiles.id, profileId));
}
