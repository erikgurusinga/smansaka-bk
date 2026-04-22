# Aplikasi Bimbingan & Konseling SMANSAKA (smansaka-bk)

Sistem Informasi Bimbingan dan Konseling **SMA Negeri 1 Kabanjahe**. Dibangun fresh,
mengikuti POP BK (Panduan Operasional Penyelenggaraan Bimbingan & Konseling) dan standar
administrasi BK di SMA. Satu ekosistem visual & teknis dengan `smansaka-inventaris` dan
`smansaka-perpustakaan`.

## Tech Stack

- **Backend:** Laravel 13, PHP 8.3
- **Frontend:** Inertia.js 3 + React 19 + TypeScript 5
- **Styling:** Tailwind CSS **4** (plugin Vite) + palet teal SMANSAKA
- **UI Kit:** Radix UI Primitives + pola shadcn/ui (komponen dicopy ke `resources/js/Components/ui/`) + lucide-react
- **Build:** Vite 8
- **Database:** MySQL 8 (`smansaka_bk`)
- **PDF:** `mpdf/mpdf` v8 — via `App\Services\PdfService` (A4, header/footer 1 cm, Unicode, font dejavusans)
- **Excel:** `maatwebsite/excel` (import siswa dari sismansaka/Dapodik, export laporan)
- **Audit:** `spatie/laravel-activitylog` (audit trail mature, bukan tabel custom)
- **File:** `spatie/laravel-medialibrary` (foto siswa, lampiran kasus, berita acara)
- **API:** Laravel Sanctum (siap untuk integrasi antar aplikasi SMANSAKA)
- **Form:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Tabel:** `@tanstack/react-table` v8
- **Chart:** `recharts` (dashboard analitik)
- **Tanggal:** `date-fns` + locale `id`
- **Toast:** `sonner`
- **Tanda tangan digital:** `signature_pad`
- **Sosiometri:** `react-force-graph-2d` atau `@antv/g6`
- **Testing:** Pest PHP 3 (backend), Vitest + Testing Library (frontend)
- **Quality gate:** Laravel Pint, ESLint, Prettier, Husky pre-commit
- **PWA:** manifest.webmanifest + service worker (install di HP untuk kerja lapangan)

## Status Pengembangan

- ✅ **Fase 1 — Fondasi** SELESAI (2026-04-22). Aplikasi siap login & dashboard.
- ⏳ Fase 2–6 belum dikerjakan.
- Dokumentasi lengkap ada di `doc/books/` (Buku 1 rancangan, Buku 2 walkthrough Fase 1).

## Warna & Tema (konsisten dengan smansaka-inventaris)

- Primary: `#117481` (teal) — palet lengkap di `resources/css/app.css` (Tailwind 4 `@theme`)
- Accent: amber/gold (analogous)
- Neutral: cool gray dengan teal undertone
- Font: Inter (loaded dari bunny.net di `resources/views/app.blade.php`)
- Template admin: identik dengan `smansaka-inventaris` dan `smansaka-perpustakaan`

## Perintah Penting

```bash
# PHP harus pakai full path (Laragon tidak expose ke PATH)
export PATH="/c/laragon/bin/php/php-8.3.30-nts-Win32-vs16-x64:$PATH"

# Composer
c:/laragon/bin/php/php-8.3.30-nts-Win32-vs16-x64/php.exe c:/laragon/bin/composer/composer.phar [command]

# Node.js harus pakai full path
export PATH="/c/laragon/bin/nodejs/node-v24.14.0-win-x64:$PATH"

# Build frontend
npm run build

# Dev server (concurrent: server + queue + pail + vite)
composer dev
```

## Autentikasi

- Login via **username** (bukan email) — pola dari `smansaka-inventaris`
- Password bcrypt, minimum 8 karakter
- User groups disimpan di kolom `groups` pada tabel `users` (format JSON)
- Permissions via tabel `group_access` (group_id + module_id → r/w)
- RBAC via middleware `CheckModuleAccess` dengan alias `module`
- Super admin: user dengan `id === 1`
- Audit otomatis via `spatie/laravel-activitylog`
- Rate limit login: 5× percobaan dalam 1 menit
- Filter `is_active = true` saat login (user nonaktif tidak bisa masuk)

### Akun Default (GANTI saat production!)

| Peran | Username | Password |
|-------|----------|----------|
| Super Admin | `admin` | `admin12345` |
| Koordinator BK | `koorbk` | `koorbk12345` |
| Guru BK 1 | `gurubk1` | `gurubk1` |
| Guru BK 2 | `gurubk2` | `gurubk2` |
| Guru BK 3 | `gurubk3` | `gurubk3` |
| Kepala Sekolah | `kepsek` | `kepsek12345` |

## Peran Pengguna (7 peran)

| Peran | Kewenangan |
|---|---|
| Super Admin | Semua akses + manajemen user, grup, modul, branding |
| Koordinator BK | Semua modul BK + supervisi semua guru BK |
| Guru BK | Modul BK untuk siswa asuh sendiri (RAHASIA hanya milik dia) |
| Wali Kelas | Lihat data kasus publik siswa di kelasnya (bukan notulen konseling) |
| Kepala Sekolah | Lihat semua laporan & dashboard (read-only) |
| Siswa | Portal siswa — request konseling, isi angket (fase akhir) |
| Orang Tua | Portal ortu — perkembangan anak (fase akhir) |

## Modul & Routes

### Inti
| Modul | Route prefix | Deskripsi |
|---|---|---|
| Dashboard | `/dashboard` | Statistik kasus, siswa asuh, jadwal layanan |
| Siswa Asuh | `/students` | CRUD siswa, import Excel, pull dari sismansaka |
| Kelas & Wali Kelas | `/classes` | Master data kelas + wali kelas |
| Orang Tua / Wali | `/parents` | Data kontak orang tua / wali siswa |
| Tahun Ajaran | `/academic-years` | Tahun ajaran aktif (analog `tahun_anggaran` di inventaris) |

### Layanan BK
| Modul | Route prefix | Deskripsi |
|---|---|---|
| Konseling Individual | `/counseling/individual` | Log sesi konseling per siswa (RAHASIA) |
| Konseling Kelompok | `/counseling/group` | Sesi konseling kelompok + peserta |
| Bimbingan Klasikal | `/counseling/classical` | Masuk kelas bawa RPL BK |
| Home Visit | `/counseling/home-visit` | Kunjungan rumah + berita acara |

### Kasus & Pelanggaran
| Modul | Route prefix | Deskripsi |
|---|---|---|
| Buku Kasus | `/cases` | Catatan kasus: akademik, pribadi, sosial, karier, pelanggaran |
| Poin Pelanggaran | `/violations` | Akumulasi poin + escalation (SP1/2/3) |
| Konferensi Kasus | `/case-conferences` | Rapat multi-pihak + notulen + tanda tangan |
| Referral | `/referrals` | Rujuk ke psikolog/puskesmas/dinas |

### Instrumen BK
| Modul | Route prefix | Deskripsi |
|---|---|---|
| AKPD | `/instruments/akpd` | Angket Kebutuhan Peserta Didik |
| DCM | `/instruments/dcm` | Daftar Cek Masalah (±240 butir) |
| Sosiometri | `/instruments/sociometry` | Pemetaan hubungan sosial per kelas |
| Minat Bakat / Karier | `/instruments/career` | RIASEC/Holland — rekomendasi jurusan |

### Program BK
| Modul | Route prefix | Deskripsi |
|---|---|---|
| RPL BK | `/programs/rpl` | Rencana Pelaksanaan Layanan |
| Program Tahunan | `/programs/annual` | Generator dari hasil AKPD/DCM |
| Program Semesteran | `/programs/semester` | Turunan program tahunan |

### Laporan & Sistem
| Modul | Route prefix | Deskripsi |
|---|---|---|
| Laporan | `/reports` | Laporan bulanan/semester/tahunan BK (PDF/Excel) |
| Sistem | `/system` | Users, groups, modules, branding, activity log |
| Profil | `/profile` | Profil user login |

## Struktur Database

### Tabel Inti
| Tabel | Keterangan |
|---|---|
| `users` | Login via username, password bcrypt, groups JSON |
| `user_groups` | Grup pengguna (Super Admin, Koordinator BK, Guru BK, Wali Kelas, Kepsek) |
| `modules` | Daftar modul untuk RBAC |
| `group_access` | Pivot: group_id + module_id → r/w |
| `settings` | Key-value settings (logo, favicon) |
| `academic_years` | Tahun ajaran aktif, periode mulai/selesai |
| `activity_log` | Spatie activity log (audit trail) |

### Master Data
| Tabel | Keterangan |
|---|---|
| `students` | Data siswa (NIS, NISN, nama, kelas, foto, alamat, dll) |
| `classes` | Kelas (nama, tingkat, tahun ajaran, wali kelas) |
| `parents` | Orang tua / wali siswa |
| `student_parents` | Pivot siswa ↔ orang tua |
| `student_guidance` | Pivot siswa ↔ guru BK (siswa asuh) |
| `teachers` | Data guru (khusus guru BK) |

### Layanan
| Tabel | Keterangan |
|---|---|
| `counseling_sessions` | Sesi konseling individual/kelompok |
| `counseling_participants` | Peserta konseling kelompok |
| `classical_guidance` | Bimbingan klasikal |
| `home_visits` | Kunjungan rumah + tanda tangan digital |

### Kasus
| Tabel | Keterangan |
|---|---|
| `cases` | Buku kasus (akademik/pribadi/sosial/karier/pelanggaran) |
| `case_attachments` | Lampiran kasus (polymorphic via Media Library) |
| `violations` | Jenis pelanggaran + poin |
| `student_violations` | Pelanggaran yang dilakukan siswa |
| `case_conferences` | Konferensi kasus + peserta + notulen |
| `referrals` | Rujukan ke pihak eksternal |

### Instrumen
| Tabel | Keterangan |
|---|---|
| `instrument_akpd_items` | Butir AKPD |
| `instrument_akpd_responses` | Jawaban siswa |
| `instrument_dcm_items` | Butir DCM |
| `instrument_dcm_responses` | Jawaban siswa |
| `sociometry_sessions` | Sesi sosiometri per kelas |
| `sociometry_choices` | Pilihan siswa terhadap teman (multi-kriteria) |
| `career_assessments` | Hasil assessment minat bakat/karier |

### Program
| Tabel | Keterangan |
|---|---|
| `rpl_bk` | RPL BK |
| `annual_programs` | Program tahunan BK |
| `semester_programs` | Program semesteran BK |

## Kerahasiaan (PRIORITAS UTAMA)

- Catatan konseling default **RAHASIA**. Field `is_confidential` + `visible_to` (array user_id).
- Hanya bisa dibaca oleh: guru BK penangani, Koordinator BK, dan Kepsek (jika flag dibuka eksplisit).
- Wali kelas TIDAK otomatis melihat isi sesi konseling.
- Semua akses ke data RAHASIA dicatat di activity log (user_id, ip, waktu, target).

## Integrasi Ekosistem SMANSAKA

- **sismansaka** (data siswa) — pull via API Sanctum (rencana)
- **smansaka-inventaris** (aset BK: ruang konseling, meja, dll)
- **smansaka-perpustakaan** (rekam peminjaman buku BK)
- **cbtakm-mobile** (data nilai CBT jika perlu untuk analisis kasus akademik)

## Desain UI (identik dengan smansaka-inventaris)

### Login Page
- Full-screen split layout: panel kiri teal (logo + info BK) + panel kanan form mengambang
- Form dalam floating card (`rounded-2xl shadow-xl`) di atas `bg-neutral-50`
- Icon di dalam input field, toggle show/hide password
- Responsive: panel kiri disembunyikan di mobile

### Sidebar
- Background putih, border kanan
- Brand card gradient teal di atas ("Bimbingan & Konseling" + "SMAN 1 Kabanjahe")
- Dashboard standalone
- Section Layanan, Kasus, Instrumen, Program (collapsible)
- Badge tahun ajaran aktif di top bar
- Tombol Keluar di bawah

### Konvensi Tabel (pakai TanStack Table)
- Sort toggle header (none → asc → desc → none)
- Per-page dropdown [10/15/25/50/100]
- Pagination: kiri info "Menampilkan X–Y dari Z" + kanan nav
- Toolbar: search kiri, filter + tambah kanan
- Empty state dengan ikon
- Modal konfirmasi hapus (bukan `confirm()` native)

### Konvensi Form (pakai react-hook-form + Zod)
- Input/Select/Textarea: `rounded-xl border-neutral-200 focus:border-primary-400 focus:ring-primary-100`
- Section: `rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100`
- Drag & drop zone untuk file upload
- Submit: `rounded-xl bg-primary-600` + loading spinner
- Error field inline, toast Sonner untuk error general

## File Statis

- Foto siswa: `storage/app/public/students/` (via Media Library)
- Lampiran kasus: `storage/app/public/cases/`
- Berita acara home visit: `storage/app/public/home-visits/`
- Logo sekolah: `public/images/logo.*`
- Favicon: `public/favicon_site.*`
- PWA icons: `public/images/pwa/`

## Keamanan

- RBAC middleware `CheckModuleAccess` — semua route dilindungi
- Super admin protection — user id=1 tidak bisa dihapus/diganti grup
- Password bcrypt + minimum 8 karakter
- Login via username, rate limited
- File upload whitelist ekstensi (jpg, jpeg, png, gif, webp, pdf)
- File deletion sanitasi path (`basename()`)
- **Activity log Spatie** (semua aksi dicatat)
- CSRF protection (Laravel default)
- Catatan RAHASIA → visibility filter di query level (scope pada Eloquent)

## Rencana Pengembangan

### Fase 1 — Fondasi ✅ SELESAI (2026-04-22)
- [x] Scaffold Laravel 13 + Inertia 3 + React 19 + TS 5 + Tailwind 4 + Vite 8
- [x] Database `smansaka_bk` + migrasi inti (users, groups, modules, settings, academic_years) + Spatie (activity_log, media)
- [x] Auth (login via username) + RBAC via `CheckModuleAccess` (alias `module:slug,read|write`)
- [x] Layout (sidebar + topbar, login split, dashboard placeholder)
- [x] Seeder (6 akun default, 21 modul, 5 grup, matriks RBAC, TA 2026/2027)
- [x] Pola shadcn/ui + Radix + lucide-react + Sonner
- [x] PWA manifest + service worker
- [x] Dokumentasi: `doc/books/02-fondasi.md` (walkthrough 21 bab)

### Fase 2 — Master Data
**Quality gate (dikerjakan di awal fase):**
- [ ] Laravel Pint (formatter PHP, konfigurasi PSR-12)
- [ ] ESLint + Prettier (formatter & linter JS/TS/TSX)
- [ ] Husky + lint-staged (pre-commit hook: Pint + Prettier + ESLint)

**Modul:**
- [ ] CRUD siswa (manual + import Excel)
- [ ] CRUD kelas, wali kelas, orang tua, guru
- [ ] Penugasan siswa asuh per guru BK
- [ ] Foto siswa via Media Library

### Fase 3 — Buku Kasus & Pelanggaran
- [ ] CRUD kasus + workflow (baru → penanganan → selesai → rujukan)
- [ ] Master data jenis pelanggaran + poin
- [ ] Akumulasi poin + escalation (SP1/SP2/SP3)
- [ ] Notifikasi email ke wali kelas & ortu saat pelanggaran dicatat

### Fase 4 — Layanan BK
- [ ] Konseling individual (dengan kerahasiaan)
- [ ] Konseling kelompok
- [ ] Bimbingan klasikal (RPL BK)
- [ ] Home visit + tanda tangan digital + PDF berita acara
- [ ] Konferensi kasus + notulen + tanda tangan
- [ ] Referral + PDF surat rujukan

### Fase 5 — Instrumen
- [ ] AKPD (angket online, hasil → rekomendasi program)
- [ ] DCM (±240 butir, peta masalah per siswa & kelas)
- [ ] Sosiometri (render diagram force-graph)
- [ ] Inventori Minat Bakat / Karier (RIASEC)

### Fase 6 — Program, Laporan, Portal
- [ ] RPL BK, Program Tahunan, Program Semesteran
- [ ] Laporan bulanan/semester/tahunan (PDF/Excel)
- [ ] Dashboard analitik (Recharts: tren kasus, kelas rawan, jenis masalah dominan)
- [ ] Notifikasi email (panggilan ortu, undangan konferensi)
- [ ] Portal siswa & orang tua (opsional — bisa digabung ke aplikasi lain)
- [ ] API Sanctum untuk integrasi dengan sismansaka

## Folder Dokumentasi

- `doc/` — dokumentasi kegiatan & rancangan dalam Markdown
- `doc/index.html` — viewer web (buka via `http://localhost/smansaka-bk/doc/`)
- `doc/books/*.md` — "buku" panduan
- Semua doc bisa dicetak ke PDF via tombol "Cetak PDF" di viewer

### Buku yang sudah terbit
| No | Judul | File |
|----|-------|------|
| 01 | Rancangan Aplikasi & Stack Teknologi | `doc/books/01-rancangan-dan-teknologi.md` |
| 02 | Fase 1: Fondasi (scaffold, auth, RBAC, tema) | `doc/books/02-fondasi.md` |

### Aturan saat menyelesaikan fase
Setelah menyelesaikan satu fase pengembangan, **wajib**:
1. Tulis `doc/books/NN-nama-fase.md` dengan pola Buku 2.
2. Register di array `BOOKS` pada `doc/index.html`.
3. Tambah baris di tabel "Daftar Buku" pada `doc/README.md`.
4. Update bagian "Status Pengembangan" dan checklist fase di CLAUDE.md.
