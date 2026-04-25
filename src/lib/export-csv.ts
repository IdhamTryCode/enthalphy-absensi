import "server-only";
import type { AttendanceRow } from "./attendance";

const HEADERS = [
  "Tanggal",
  "Jam",
  "Status",
  "Nama",
  "Email",
  "Divisi",
  "Latitude",
  "Longitude",
  "Alamat",
  "Flag",
  "Catatan",
  "Link Foto",
];

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Excel-friendly: quote kalau ada koma, kutip, atau newline
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Generate CSV content dari attendance rows.
 * Format: BOM UTF-8 + delimiter `;` (compatible dengan Excel locale ID).
 */
export function attendanceToCsv(rows: AttendanceRow[]): string {
  const lines = [HEADERS.map(escapeCsv).join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.tanggal,
        r.jam,
        r.status,
        r.nama,
        r.email,
        r.divisionName ?? "",
        r.latitude,
        r.longitude,
        r.alamat,
        r.flag ?? "",
        r.note ?? "",
        r.linkFoto,
      ]
        .map(escapeCsv)
        .join(";"),
    );
  }
  // BOM UTF-8 di awal supaya Excel buka dengan encoding benar
  return "﻿" + lines.join("\r\n");
}
