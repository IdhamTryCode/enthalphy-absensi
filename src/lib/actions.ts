"use server";

import { put, del } from "@vercel/blob";
import { z } from "zod";
import { requireUser } from "./current-user";
import {
  appendAttendance,
  getTodayStateByUserId,
  type AttendanceStatus,
} from "./attendance";
import { reverseGeocode } from "./geocode";
import { todayWIB } from "./time";

const submitSchema = z.object({
  status: z.enum(["Masuk", "Pulang"]),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  note: z.string().max(500).optional().default(""),
});

export type SubmitResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function submitAttendance(formData: FormData): Promise<SubmitResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const parsed = submitSchema.safeParse({
    status: formData.get("status"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Data tidak lengkap atau tidak valid." };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: "Foto wajib diambil." };
  }
  if (photo.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Foto terlalu besar (max 5 MB)." };
  }
  if (!photo.type.startsWith("image/")) {
    return { ok: false, error: "File yang diunggah bukan gambar." };
  }

  const { status, latitude, longitude, note } = parsed.data;

  const state = await getTodayStateByUserId(user.id);
  if (status === "Masuk" && state.checkIn) {
    return {
      ok: false,
      error: `Kamu sudah check-in hari ini jam ${state.checkIn.jam}. Hubungi admin kalau perlu koreksi.`,
    };
  }
  if (status === "Pulang") {
    if (!state.checkIn) {
      return { ok: false, error: "Harus check-in dulu sebelum check-out." };
    }
    if (state.checkOut) {
      return {
        ok: false,
        error: `Kamu sudah check-out hari ini jam ${state.checkOut.jam}. Hubungi admin kalau perlu koreksi.`,
      };
    }
  }

  const ext = photo.type === "image/png" ? "png" : "jpg";
  const safeEmail = user.email.replace(/[^a-z0-9]/gi, "_");
  const key = `absensi/${todayWIB()}/${safeEmail}-${status}-${Date.now()}.${ext}`;
  let linkFoto: string;
  try {
    const blob = await put(key, photo, {
      access: "public",
      contentType: photo.type,
    });
    linkFoto = blob.url;
  } catch (err) {
    console.error("Blob upload failed:", err);
    return { ok: false, error: "Gagal upload foto. Coba lagi." };
  }

  const alamat = await reverseGeocode(latitude, longitude);

  try {
    await appendAttendance({
      userId: user.id,
      status: status as AttendanceStatus,
      latitude,
      longitude,
      alamat,
      linkFoto,
      note: note || null,
    });
  } catch (err) {
    console.error("DB insert failed:", err);
    // Cleanup foto orphan supaya storage tidak terbuang
    try {
      await del(linkFoto);
    } catch (delErr) {
      console.error("Failed to cleanup orphan blob:", delErr);
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("attendance_user_tanggal_status_uniq")) {
      return {
        ok: false,
        error: "Absensi sudah tercatat di waktu yang sama. Refresh dashboard.",
      };
    }
    return {
      ok: false,
      error: "Gagal menyimpan absensi. Coba lagi atau hubungi admin.",
    };
  }

  return {
    ok: true,
    message: status === "Masuk" ? "Check-in berhasil." : "Check-out berhasil.",
  };
}
