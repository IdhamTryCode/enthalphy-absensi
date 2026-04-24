"use server";

import { put } from "@vercel/blob";
import { z } from "zod";
import { auth } from "./auth";
import {
  appendAttendance,
  getTodayState,
  type AttendanceStatus,
} from "./attendance";
import { reverseGeocode } from "./geocode";
import { todayWIB } from "./time";

const submitSchema = z.object({
  status: z.enum(["Masuk", "Pulang"]),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type SubmitResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function submitAttendance(formData: FormData): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const parsed = submitSchema.safeParse({
    status: formData.get("status"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
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

  const { status, latitude, longitude } = parsed.data;
  const email = session.user.email;
  const nama = session.user.name ?? email;

  // Lock: 1× check-in + 1× check-out per tanggal, check-out harus setelah check-in
  const state = await getTodayState(email);
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

  // Upload foto
  const ext = photo.type === "image/png" ? "png" : "jpg";
  const safeEmail = email.replace(/[^a-z0-9]/gi, "_");
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

  // Reverse geocode (best-effort)
  const alamat = await reverseGeocode(latitude, longitude);

  // Append ke Sheet
  try {
    await appendAttendance({
      nama,
      email,
      status: status as AttendanceStatus,
      latitude,
      longitude,
      alamat,
      linkFoto,
    });
  } catch (err) {
    console.error("Sheet append failed:", err);
    return { ok: false, error: "Foto tersimpan, tapi gagal menulis ke sheet. Hubungi admin." };
  }

  return {
    ok: true,
    message: status === "Masuk" ? "Check-in berhasil." : "Check-out berhasil.",
  };
}
