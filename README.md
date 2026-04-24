# Absensi Enthalphy

Sistem absensi berbasis web untuk PT Enthalphy Environergy Consulting. Karyawan mencatat kehadiran dengan foto *live* kamera depan dan lokasi GPS; data tersimpan di Google Sheets dan foto di Vercel Blob.

## Fitur

- **Login Google** (NextAuth v5) — hanya test user yang terdaftar di Google Cloud Console selama app masih di mode Testing. Opsional restrict ke domain tertentu via `ALLOWED_EMAIL_DOMAIN`.
- **Check-in / Check-out** — sekali per tanggal, terkunci setelah submit (standar HRIS). Flag otomatis `Telat` (> `WORK_START`) dan `Pulang Cepat` (< `WORK_END`).
- **Foto live** dari kamera depan, dikompresi ke max 1280 px / JPEG quality 0.8 sebelum upload.
- **Lokasi GPS** + reverse geocoding via Nominatim OpenStreetMap.
- **Role admin** — daftar email di `ADMIN_EMAILS` mendapat akses `/admin` untuk rekap semua karyawan.
- **Zona waktu Asia/Jakarta (WIB)** konsisten di semua timestamp & bucket tanggal.

## Tech Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react
- NextAuth v5 (Google provider)
- Google Sheets API (service account) untuk penyimpanan data
- Vercel Blob untuk penyimpanan foto
- Zod untuk validasi env & input
- date-fns-tz untuk WIB

## Persyaratan

- Node.js 20+
- pnpm 10+
- Akun Google Cloud Platform
- Akun Vercel dengan Blob store

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Google Cloud Console

1. Buat project baru di <https://console.cloud.google.com/>.
2. Setup **OAuth consent screen** (External), tambahkan email penguji sebagai **Test users**.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** (Web application):
   - Authorized JavaScript origins: `http://localhost:3000` (+ URL production)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (+ URL production)
   - Simpan **Client ID** dan **Client secret**.
4. **APIs & Services → Library** — enable **Google Sheets API**.
5. **IAM & Admin → Service Accounts**: buat service account baru (mis. `absensi-writer`), lalu **Keys → Add Key → JSON**, download JSON key-nya.

### 3. Google Sheet

1. Buat 1 spreadsheet baru, contoh nama: `Absensi Enthalphy`.
2. Rename tab pertama jadi **`Attendance`**.
3. Isi header di baris 1 (A1 sampai K1):

   ```
   Timestamp | Nama | Email | Tanggal | Jam | Status | Latitude | Longitude | Alamat | Link Foto | Flag
   ```

4. **Share** spreadsheet ke email service account (`xxx@xxx.iam.gserviceaccount.com`) dengan role **Editor**. Uncheck "Notify people".
5. Copy **Sheet ID** dari URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.

### 4. Vercel Blob

1. Di Vercel dashboard → project terkait → **Storage → Create Database → Blob**.
2. Name store (mis. `absensi-foto`), pilih region terdekat.
3. `pnpm dlx vercel link` → `pnpm dlx vercel env pull .env.local` untuk mendapatkan `BLOB_READ_WRITE_TOKEN`.

### 5. Environment variables

Copy `.env.example` ke `.env.local` dan isi:

```bash
cp .env.example .env.local
```

| Variable                      | Deskripsi                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                 | Secret NextAuth. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_URL`                    | URL aplikasi (mis. `http://localhost:3000` untuk dev).                                                   |
| `AUTH_GOOGLE_ID`              | OAuth Client ID dari step 2.                                                                             |
| `AUTH_GOOGLE_SECRET`          | OAuth Client Secret dari step 2.                                                                         |
| `GOOGLE_SERVICE_ACCOUNT_B64`  | JSON service account key (base64-encoded). Lihat di bawah.                                               |
| `GOOGLE_SHEET_ID`             | Sheet ID dari step 3.                                                                                    |
| `BLOB_READ_WRITE_TOKEN`       | Token Vercel Blob (step 4, auto-pulled via `vercel env pull`).                                           |
| `ALLOWED_EMAIL_DOMAIN`        | Opsional. Isi `enthalphy.com` untuk membatasi hanya domain itu. Kosongkan untuk semua domain.            |
| `ADMIN_EMAILS`                | Daftar email admin, dipisah koma.                                                                        |
| `WORK_START`                  | Jam masuk standar (`HH:mm`). Default `08:00`.                                                            |
| `WORK_END`                    | Jam pulang standar (`HH:mm`). Default `17:00`.                                                           |

**Encode service account JSON ke base64:**

```bash
# macOS / Linux
base64 -i path/to/key.json | tr -d '\n'

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\key.json"))
```

Paste hasilnya (satu baris, tanpa kutip) ke `GOOGLE_SERVICE_ACCOUNT_B64`.

### 6. Verifikasi koneksi

```bash
pnpm verify:google   # Test auth + read/write Google Sheet
pnpm verify:blob     # Test upload + delete ke Vercel Blob
```

Kedua harus lolos sebelum menjalankan dev server.

### 7. Jalankan dev server

```bash
pnpm dev
```

Buka <http://localhost:3000>.

> **Catatan:** Kamera & GPS hanya aktif di `localhost` atau `https://`. Untuk testing di handphone, gunakan `ngrok` atau deploy ke Vercel.

## Deployment

1. Push repository ke GitHub.
2. Import project di Vercel dashboard.
3. Set semua environment variables di **Project Settings → Environment Variables** (nilai yang sama dengan `.env.local`, kecuali `AUTH_URL` → ganti ke URL production).
4. Tambahkan URL production ke **Authorized JavaScript origins** & **Authorized redirect URIs** di Google Cloud Console (OAuth Client).
5. Deploy.

## Struktur Project

```
src/
├── app/
│   ├── absen/            Camera + GPS + submit form (client)
│   ├── admin/            Rekap absensi semua karyawan (admin-only)
│   ├── api/auth/         NextAuth route handler
│   ├── dashboard/        Dashboard personal + tombol aksi
│   ├── login/            Halaman login
│   ├── globals.css       Theme tokens + utility kustom
│   └── layout.tsx
├── components/ui/        shadcn/ui components
├── lib/
│   ├── actions.ts        Server action submit attendance
│   ├── attendance.ts     Read/write Google Sheet
│   ├── auth.ts           NextAuth config
│   ├── env.ts            Zod env validation
│   ├── geocode.ts        Nominatim reverse geocoding
│   ├── google.ts         Sheets API client (service account)
│   ├── time.ts           Helper WIB + flag Telat/Pulang Cepat
│   └── utils.ts
└── types/
    └── next-auth.d.ts    Augment session dengan `isAdmin`
scripts/
├── verify-google.ts      Smoke test Sheet connectivity
├── verify-blob.ts        Smoke test Blob upload
└── reset-today.ts        Hapus record hari ini (debug/testing)
```

## Scripts

| Command                              | Keterangan                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                           | Jalankan dev server dengan Turbopack.                                                                        |
| `pnpm build`                         | Build production.                                                                                            |
| `pnpm start`                         | Jalankan hasil build.                                                                                        |
| `pnpm lint`                          | ESLint.                                                                                                      |
| `pnpm verify:google`                 | Test koneksi Google Sheets.                                                                                  |
| `pnpm verify:blob`                   | Test koneksi Vercel Blob.                                                                                    |
| `pnpm reset:today <email> [tanggal]` | Hapus record user di tanggal tertentu (default hari ini). Butuh email eksplisit untuk mencegah kecelakaan.    |

## Logic Absensi (ringkas)

- **Check-in**: hanya sekali per tanggal per user. Row pertama yang tercatat dianggap official.
- **Check-out**: hanya sekali per tanggal, dan hanya setelah ada check-in.
- **Setelah check-out**: tidak bisa absen ulang. Perlu koreksi? Admin edit manual di Google Sheet.
- **Flag**:
  - `Telat` bila jam check-in > `WORK_START`.
  - `Pulang Cepat` bila jam check-out < `WORK_END`.
- **Audit**: server menolak submit ganda dengan pesan eksplisit. Logic selalu ambil row pertama bila ada duplikat.

## Keamanan

- Service account key dan token OAuth hanya ada di `.env.local` (ignored oleh git).
- Semua upload foto lewat server action Next.js — token Blob tidak pernah terekspos ke client.
- Domain email restriction opsional via `ALLOWED_EMAIL_DOMAIN`.
- Admin role ditentukan di server-side dari `ADMIN_EMAILS` (tidak bisa dimanipulasi dari client).
- Session JWT-based dengan `AUTH_SECRET` random 32-byte.

## Lisensi

Internal — PT Enthalphy Environergy Consulting.
