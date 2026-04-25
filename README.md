# Absensi Enthalphy

Sistem absensi berbasis web untuk PT Enthalphy Environergy Consulting. Karyawan mencatat kehadiran dengan foto *live* kamera depan dan lokasi GPS; data tersimpan di Supabase Postgres dan foto di Vercel Blob.

## Fitur

### Untuk semua karyawan
- **Login** email/password atau Google OAuth — pre-registered only (admin invite duluan).
- **Lupa password** + reset via email.
- **Check-in / Check-out** sekali per tanggal, terkunci setelah submit (standar HRIS). Flag otomatis `Telat` (> `WORK_START`) dan `Pulang Cepat` (< `WORK_END`).
- **Foto live** dari kamera depan, dikompresi ke max 1280 px / JPEG quality 0.8 sebelum upload.
- **Lokasi GPS** + reverse geocoding via Nominatim OpenStreetMap.
- **Catatan harian** opsional saat check-in (rencana) dan check-out (laporan).
- **Riwayat absensi 30 hari** dengan toggle list ↔ kalender + stats bulan ini.

### Untuk admin
- **Dashboard rekap** dengan filter tanggal, karyawan, divisi, flag.
- **Quick preset**: Hari ini / Minggu ini / Bulan ini.
- **Search bar** real-time + pagination.
- **Export CSV** sesuai filter aktif (Excel-friendly UTF-8 + `;` delimiter).
- **CRUD divisi**.
- **Invite karyawan** by email (Supabase kirim email "set password").
- **Resend invite** untuk yang belum claim.
- **Edit / nonaktifkan / hapus** karyawan dengan self-protection.
- **Koreksi attendance** dengan alasan wajib + audit log.
- **Foto thumbnail** dengan modal zoom (next/image optimized).

### Otomatis
- **Cleanup foto >30 hari** via Vercel Cron daily 00:00 WIB.
- **Session refresh** + auto-redirect ke login saat session expired.

### Zona waktu
Asia/Jakarta (WIB) konsisten di semua timestamp & bucket tanggal.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui** + **lucide-react** + **sonner**
- **Supabase Auth** (email/password + Google OAuth) via `@supabase/ssr`
- **Supabase Postgres** sebagai database
- **Drizzle ORM** untuk query domain (typed, SQL-first)
- **Vercel Blob** untuk penyimpanan foto
- **Vercel Cron** untuk auto-cleanup
- **Zod** untuk validasi env & input
- **date-fns-tz** untuk WIB

## Persyaratan

- Node.js 20+
- pnpm 10+
- Akun [Supabase](https://supabase.com) (free tier cukup)
- Akun [Vercel](https://vercel.com) dengan Blob store
- (Opsional) Google Cloud Project untuk OAuth — bisa pakai project yang sudah ada

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Supabase Project

1. Buat project baru di <https://supabase.com/dashboard>.
2. Pilih region terdekat (untuk Indonesia: **Southeast Asia (Singapore)**).
3. Tunggu provisioning ~2 menit.
4. **Project Settings → API** — copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (**rahasia**)
5. **Project Settings → Database → Connection string → Transaction pooler** — copy & ganti `[YOUR-PASSWORD]` → `DATABASE_URL`.

### 3. Apply schema migrations

Schema sudah ada di `supabase_migrations.schema_migrations`. Setelah project baru, MCP atau CLI bisa apply:

- **Via MCP** (in-IDE): pakai Claude Code dengan Supabase MCP server, jalankan `apply_migration` untuk file di folder `supabase/migrations/` (kalau di-export).
- **Via Supabase CLI**: `supabase db push`.
- **Manual**: copy SQL dari migrasi yang ada (`001_initial_schema`, `002_disable_rls...`, `003_migrate_to_supabase_auth`, `004_enable_rls_with_policies`, `006_revert_first_user_admin_logic`, `007_only_invited_users_get_profiles`) lalu run di **SQL Editor**.

Schema yang dihasilkan:
- `divisions`, `profiles`, `attendance`, `attendance_edits` di schema `public`
- Trigger `handle_new_auth_user` (sync `auth.users` → `profiles`, hanya untuk invited users)
- Function `is_admin()` untuk RLS
- RLS policies aktif di semua tabel

### 4. Konfigurasi Auth di Supabase

#### a. Google OAuth provider

1. **Authentication → Providers → Google** → Enable.
2. Copy **Callback URL (for OAuth)** dari Supabase (mis. `https://xxx.supabase.co/auth/v1/callback`).
3. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Buat **OAuth Client ID** type **Web application**.
   - **Authorized redirect URIs**: paste callback URL Supabase.
   - Copy **Client ID** + **Client Secret**.
4. Balik ke Supabase, paste Client ID + Secret. **Save**.

#### b. URL Configuration

**Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (dev) atau URL production.
- **Redirect URLs** (allow list):
  ```
  http://localhost:3000/**
  https://your-production-domain.com/**
  ```

#### c. Disable email signup

**Authentication → Providers → Email** → toggle **Enable email signup** = **OFF**.

User baru hanya bisa masuk via admin invite. (Google OAuth signup secara default tetap bisa, tapi app me-reject di layer aplikasi via trigger DB + check di `/auth/callback`.)

### 5. Vercel Blob

1. Bikin project di Vercel (atau import dari GitHub repo).
2. **Storage → Create Database → Blob** — name `absensi-foto`, pilih region Singapore (SIN1).
3. Connect ke project.
4. `pnpm dlx vercel link` → `pnpm dlx vercel env pull .env.local` untuk auto-pull `BLOB_READ_WRITE_TOKEN`.

### 6. Environment variables

Copy `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

| Variable                       | Deskripsi                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase project URL.                                                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase anon key (browser-safe, dilindungi RLS).                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase service role key (**rahasia**, bypass RLS — hanya server actions).                                        |
| `DATABASE_URL`                 | Postgres pooler URL (port 6543, transaction mode) untuk Drizzle.                                                   |
| `BLOB_READ_WRITE_TOKEN`        | Vercel Blob token (auto-pulled via `vercel env pull`).                                                             |
| `ALLOWED_EMAIL_DOMAIN`         | Opsional. Isi `enthalphy.com` untuk membatasi hanya domain itu. Kosongkan untuk semua domain.                      |
| `WORK_START`                   | Jam masuk standar (`HH:mm`). Default `08:00`.                                                                      |
| `WORK_END`                     | Jam pulang standar (`HH:mm`). Default `17:00`.                                                                     |
| `CRON_SECRET`                  | Auto-injected oleh Vercel saat enable Cron. Min 16 karakter.                                                       |
| `NEXT_PUBLIC_SITE_URL`         | URL absolut aplikasi (mis. `https://app.example.com`). Dipakai untuk link di email invite & reset password.        |

### 7. Verifikasi koneksi (dev)

```bash
pnpm verify:db      # Test connect Postgres + list tables
pnpm verify:blob    # Test upload + delete ke Vercel Blob
```

Kedua harus lolos sebelum jalankan dev server.

### 8. Bootstrap admin pertama

Setelah schema di-apply, DB profiles kosong. Untuk login pertama kali:

**Opsi A — Manual via SQL** (paling cepat):

1. Buka `/login`, klik "Lanjut dengan Google", login pakai akun yang akan jadi admin.
2. Akan ditolak (tidak ada profile). User entry masuk ke `auth.users`.
3. Buka **Supabase SQL Editor**, jalankan:
   ```sql
   INSERT INTO public.profiles (id, email, name, role, is_active)
   SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'admin', TRUE
   FROM auth.users
   WHERE email = 'admin-pertama@example.com';
   ```
4. Logout + login ulang. Sekarang masuk sebagai admin.

**Opsi B — Invite admin lewat Supabase Dashboard**:

1. **Authentication → Users → Add user → Send invite** dengan email yang akan jadi admin.
2. Buka SQL Editor, run:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'admin-pertama@example.com';
   ```
3. User cek email, klik invite, set password, login.

### 9. Jalankan dev server

```bash
pnpm dev
```

Buka <http://localhost:3000>.

> **Catatan:** Kamera & GPS hanya aktif di `localhost` atau `https://`. Untuk testing di handphone, gunakan `ngrok` atau deploy ke Vercel.

## Deployment

1. Push repository ke GitHub.
2. Import project di Vercel Dashboard.
3. **Settings → Environment Variables** — set semua env yang ada di `.env.local` (untuk Production + Preview + Development). Pastikan `NEXT_PUBLIC_SITE_URL` ke domain production.
4. **Settings → Cron Jobs** — toggle Enable. Cron `/api/cron/cleanup-photos` schedule `0 17 * * *` (UTC = 00:00 WIB).
5. Update **Site URL** + **Redirect URLs** di Supabase Auth → URL Configuration ke domain production.
6. Update **Authorized redirect URIs** di Google Cloud Console (kalau pakai custom domain).
7. Deploy.

## Struktur Project

```
src/
├── app/
│   ├── login/, lupa-password/    Auth entry points
│   ├── auth/
│   │   ├── callback/             OAuth callback handler
│   │   ├── reset-password/       Form set password (dari link reset)
│   │   └── set-password/         Form set password (dari invite)
│   ├── dashboard/                Status hari ini + tombol absen + link admin/riwayat
│   ├── absen/                    Camera + GPS + note + submit (client)
│   ├── riwayat/                  Stats bulan + 30 hari (list + calendar view)
│   ├── admin/
│   │   ├── layout.tsx            Sidebar admin + active route highlight
│   │   ├── page.tsx              Rekap dengan filter, search, export, pagination
│   │   ├── users/                Invite/edit/hapus + status pending/active
│   │   ├── divisi/               CRUD divisi
│   │   └── koreksi/[id]/         Edit attendance + audit log (atomic transaction)
│   ├── api/
│   │   ├── admin/export/         CSV download endpoint
│   │   └── cron/cleanup-photos/  Daily blob cleanup (CRON_SECRET protected)
│   ├── error.tsx                 Per-route error boundary
│   └── global-error.tsx          Root-layout error fallback
├── components/
│   ├── ui/                       shadcn/ui primitives
│   ├── photo-thumbnail.tsx       Click-to-zoom modal (next/image)
│   └── session-guard.tsx         Auto-redirect saat session expired (client)
├── db/
│   ├── index.ts                  Singleton Drizzle client (HMR-safe)
│   └── schema.ts                 Tables, enums, relations
├── lib/
│   ├── supabase/                 Server / browser / admin / middleware clients
│   ├── current-user.ts           getCurrentUser, requireUser, requireAdmin, signOut
│   ├── users.ts                  Profile CRUD (with invite status)
│   ├── divisions.ts              Divisi CRUD
│   ├── attendance.ts             Attendance queries
│   ├── actions.ts                submitAttendance server action
│   ├── admin-actions.ts          Invite, resend, edit, koreksi (atomic)
│   ├── export-csv.ts             CSV generator
│   ├── geocode.ts                Nominatim reverse geocoding
│   ├── time.ts                   WIB helpers
│   ├── env.ts                    Zod env validation (dengan superRefine)
│   └── utils.ts                  cn() utility
└── proxy.ts                      Next 16 middleware: refresh Supabase session
scripts/
├── verify-db.ts                  Smoke test Postgres connection
├── verify-blob.ts                Smoke test Vercel Blob
└── inspect-blob.ts               List all photos + stats
```

## Scripts

| Command                      | Keterangan                                  |
| ---------------------------- | ------------------------------------------- |
| `pnpm dev`                   | Jalankan dev server.                        |
| `pnpm build`                 | Build production.                           |
| `pnpm start`                 | Jalankan hasil build.                       |
| `pnpm lint`                  | ESLint.                                     |
| `pnpm verify:db`             | Test koneksi Postgres + list tables.        |
| `pnpm verify:blob`           | Test koneksi Vercel Blob.                   |
| `pnpm inspect:blob`          | List semua foto di Blob + stats size.       |
| `pnpm db:generate`           | Generate migrasi Drizzle dari schema.       |
| `pnpm db:migrate`            | Apply migrasi Drizzle.                      |
| `pnpm db:studio`             | Buka Drizzle Studio (UI inspect DB).        |

## Logic Absensi (ringkas)

- **Pre-registration enforced**: user baru hanya bisa login kalau sudah di-invite admin via `/admin/users`. Login Google dengan email yang belum di-invite → ditolak ("Akun ini belum terdaftar").
- **Check-in**: hanya sekali per tanggal per user.
- **Check-out**: hanya sekali per tanggal, dan hanya setelah ada check-in.
- **Setelah check-out**: tidak bisa absen ulang. Perlu koreksi? Admin edit lewat `/admin/koreksi/[id]`.
- **Flag otomatis**:
  - `Telat` bila jam check-in > `WORK_START`.
  - `Pulang Cepat` bila jam check-out < `WORK_END`.
- **Audit trail**: server tolak submit ganda dengan UNIQUE constraint. Setiap koreksi admin tersimpan di `attendance_edits` (atomic transaction).

## Keamanan

- **3-layer defense untuk akses kontrol**:
  1. DB trigger `handle_new_auth_user` — profile hanya dibuat kalau `invited_at IS NOT NULL`.
  2. `/auth/callback` route — sign-out paksa kalau profile tidak ada setelah Google OAuth.
  3. `getCurrentUser` server helper — sign-out paksa di setiap server component.
- **Service role key** hanya di server (Vercel env, tidak di-bundle ke browser).
- **Anon key** di browser tetap dilindungi RLS (kalau Supabase JS client dipakai — saat ini hanya untuk Auth API).
- **Drizzle** pakai DATABASE_URL dengan role `postgres` → bypass RLS (server-only access).
- **Admin role** ditentukan di server-side dari kolom `profiles.role`.
- **Self-protection**: admin tidak bisa demote/nonaktifkan/hapus akun sendiri.
- **Cron endpoint** dilindungi `CRON_SECRET` (min 16 char, validasi strict).
- **Storage foto** auto-cleanup >30 hari supaya tidak menumpuk.
- **Foto orphan cleanup**: kalau DB insert gagal setelah upload, foto otomatis didelete.

## Kapasitas

| Karyawan aktif | Storage Blob/bulan (retensi 30 hari) | Free tier OK? |
| -------------- | ------------------------------------ | ------------- |
| 50             | ~330 MB                              | ✅            |
| 100            | ~660 MB                              | ✅            |
| 150            | ~990 MB                              | ⚠️ mepet 1GB  |
| 200            | ~1.3 GB                              | ❌ upgrade Pro|

DB Postgres free tier (500 MB) cukup untuk **2000+ karyawan × 1 tahun** absensi (~900K rows × 12 kolom).

## Lisensi

Internal — PT Enthalphy Environergy Consulting.
