# Project Plan: Web-Based Attendance System (Google Ecosystem)

## Project Overview
Membangun aplikasi absensi berbasis web (PWA) yang menggunakan Google sebagai infrastruktur utama. Data disimpan di Google Sheets, foto di Google Drive, dan login menggunakan akun Google.

### Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS (Theme: Orange & White)
- **Auth:** NextAuth.js (Google Provider)
- **API:** Google APIs (Google Sheets & Google Drive)
- **Features:** Geotagging, Live Camera, Auto-delete (Apps Script)

---

## Phase 1: Setup & Authentication
1. **Initialize Project:** Setup Next.js terbaru dengan Tailwind CSS.
2. **Google Cloud Console:** - Setup OAuth 2.0 Credentials.
   - Aktifkan Google Sheets API dan Google Drive API.
   - Buat Service Account untuk akses tulis data ke Sheets/Drive.
3. **Authentication:** - Implementasi NextAuth.js dengan Google Provider.
   - Batasi akses (opsional) hanya untuk domain email tertentu jika diminta.
   - UI Login: Minimalis, background putih, aksen orange, tombol "Login with Google".

## Phase 2: Core Attendance Features
1. **Camera Module:** - Gunakan `MediaDevices API` untuk akses kamera depan secara live.
   - Fungsi jepret foto (format base64/blob) dengan validasi "Live Only" (bukan upload galeri).
2. **Location Module:**
   - Gunakan `Geolocation API` untuk mengambil Latitude & Longitude.
   - Tambahkan fungsi *Reverse Geocoding* (bisa pakai library atau API gratisan) untuk mendapatkan nama kecamatan/kota.
3. **Attendance Logic:**
   - Buat dua aksi utama: `Check-in` dan `Check-out`.
   - Pastikan data dikirim secara aman ke server-side (API Routes).

## Phase 3: Integration (Backend)
1. **Google Drive Integration:**
   - Buat fungsi upload foto dari Next.js ke folder Google Drive tertentu.
   - Kembalikan `webViewLink` untuk disimpan di Google Sheets.
2. **Google Sheets Integration:**
   - Gunakan library `google-spreadsheet` atau `googleapis`.
   - Simpan data dengan format kolom: `Nama`, `Email`, `Tanggal`, `Jam`, `Status (Masuk/Pulang)`, `Lokasi (Lat, Long)`, `Alamat`, `Link Foto`.
3. **UI Implementation:**
   - Dashboard Karyawan: Tampilkan status hari ini dan tombol absen yang besar (Orange).
   - Pastikan desain responsif untuk layar smartphone.

## Phase 4: Automation & Cleanup
1. **Google Apps Script:**
   - Pasang script di Google Drive untuk otomatisasi penghapusan file.
   - Fungsi: `hapusFotoLama()` yang membuang file di folder foto yang berusia >30 hari ke Trash.
   - Setup Trigger: Jalankan setiap hari pukul 00:00.

## Phase 5: Testing & Deployment
1. **Testing:**
   - Uji coba akses kamera dan GPS di browser Chrome (Android) dan Safari (iOS).
   - Validasi alur data dari web sampai masuk ke baris terakhir Google Sheets.
2. **Deployment:** - Deploy ke Vercel/Netlify.
   - Konfigurasi environment variables (`GOOGLE_CLIENT_ID`, `SERVICE_ACCOUNT_KEY`, dll).
   - Setup Custom Domain jika sudah tersedia.

---

## Design Guidelines
- **Primary Color:** #FF8C00 (Orange)
- **Secondary Color:** #FFFFFF (White)
- **Font:** Inter atau Sans Serif modern.
- **Vibe:** Clean, profesional, dan cepat (seperti Mekari Talenta).