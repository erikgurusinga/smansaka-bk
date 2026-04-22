# Buku Ketujuh — Fase 6: Program BK, Laporan & Dashboard Analitik

*Dokumentasi implementasi fase program & laporan untuk aplikasi smansaka-bk — fondasi Fase 6 selesai 2026-04-23.*

Fase 6 menutup inti aplikasi BK dengan tiga komponen yang mengubah data mentah
dari fase-fase sebelumnya menjadi **keputusan & dokumen kerja**:

1. **Dashboard analitik** — ringkasan visual seluruh aktivitas BK
2. **RPL BK** — Rencana Pelaksanaan Layanan (dokumen perencanaan intervensi)
3. **Laporan bulanan** — rekap tercetak PDF untuk arsip & pelaporan kepala sekolah

Catatan cakupan: Fase 6 ini berfokus pada **core deliverable** yang langsung
dipakai sekolah. Program Tahunan & Semesteran, notifikasi email, portal
siswa/orang tua, dan API Sanctum akan dikerjakan di iterasi lanjutan karena
memerlukan infrastruktur tambahan (SMTP setup, guard baru, dsb.).

---

## Bab 1 — Dashboard: Dari Placeholder ke Analitik Nyata

### Sebelumnya

`DashboardController` hanya mengembalikan 4 angka statis dengan nilai 0.
Halaman Dashboard menampilkan "Fase 1 ✅" sebagai placeholder.

### Sekarang

6 `StatCard` terisi data real:
- Siswa Aktif
- Kasus Aktif (status `baru` + `penanganan`)
- Konseling Minggu Ini (semua tipe)
- Home Visit Bulan Ini
- Klasikal Bulan Ini
- Referral TA Aktif

Empat chart Recharts:
- **LineChart** tren 6 bulan — 3 seri (kasus, pelanggaran, konseling)
- **PieChart donut** distribusi status kasus
- **BarChart horizontal** top 5 kelas rawan (akumulasi poin pelanggaran)
- **BarChart** distribusi butir AKPD dicentang per bidang

Plus daftar 5 kasus terbaru + 5 sesi konseling terbaru.

### Keputusan teknis

**Recharts butuh `react-is` sebagai peer dependency**. Saat build pertama,
Rolldown gagal resolve. Solusi: `npm install react-is --legacy-peer-deps`
(proyek pakai React 19 yang konflik dengan ESLint plugin-react versi lama —
flag ini aman untuk dev dep resolution).

**Top 5 kelas rawan** pakai query leftJoin 3 tabel (classes → students →
student_violations → violations) dengan SUM poin. Leftjoin penting: kelas tanpa
pelanggaran tetap muncul dengan `total_points = 0`. Filter TA aktif ditaruh di
JOIN condition supaya leftjoin behavior tidak rusak.

**Tren 6 bulan** loop dari `i=5` sampai `i=0` untuk urutan kronologis (paling
lama → terbaru). Tiap iterasi 3 query count — total 18 query kecil.
Reasonable: halaman dashboard tidak sering reload.

**AKPD distribution** hanya jalan kalau `$yearId` ada. TA belum aktif → array
kosong → frontend tampilkan CTA "Mulai dari menu AKPD".

### Implementasi Recharts

Satu Dashboard component mengimport 8+ element Recharts. Bundle size akhir:
~392 KB (gzip 112 KB). Besar tapi hanya ter-load di halaman Dashboard, bukan
di halaman lain. Tidak masalah untuk dashboard yang jarang di-refresh.

---

## Bab 2 — RPL BK: Dokumen Perencanaan Layanan

RPL (Rencana Pelaksanaan Layanan) adalah dokumen formal yang wajib dimiliki
guru BK sebelum memberikan layanan klasikal / kelompok / individual. Strukturnya
mengikuti POP BK.

### Skema `rpl_bk`

```
id, counselor_id, academic_year_id, title,
bidang (pribadi/sosial/belajar/karier),
service_type (klasikal/kelompok/individual/konsultasi),
class_level (X/XI/XII/semua),
duration_minutes, objective, method, materials, activities, evaluation,
semester (ganjil/genap), timestamps
```

Nama tabel `rpl_bk` (bukan `rpl` atau `rencana_layanan`) — alasan: konsisten
dengan nama menu di sidebar "RPL BK", jelas di console dan skema migrasi.

### Form: 3 grid + 5 textarea

Halaman `Programs/Rpl/Index.tsx` memakai pola **Dialog CRUD** (sama dengan
Violations & Classical dari fase sebelumnya). Form dibagi menjadi:

1. Judul (full width)
2. Bidang · Jenis Layanan · Kelas (grid-3)
3. Durasi · Semester (grid-2)
4. Tujuan Layanan (textarea)
5. Metode & Media (grid-2 textarea)
6. Langkah Kegiatan (textarea)
7. Evaluasi (textarea)

Max-width Dialog di-set `max-w-3xl` karena form padat — `max-w-lg` (default
Violations) terlalu sempit untuk 13 field.

### Filter list: 5 filter

- Search judul
- Bidang (pribadi/sosial/belajar/karier)
- Jenis (klasikal/kelompok/individual/konsultasi)
- Semester (ganjil/genap)
- Tahun Ajaran

Kombinasi cukup untuk guru BK menelusuri "RPL bidang karier semester ganjil
TA 2026/2027".

### PDF output

Halaman Show punya tombol "Cetak PDF" → route `rpl.pdf` → `PdfService::inline()`
→ template `pdf/rpl-bk.blade.php`. Layout: header SMA Negeri 1 Kabanjahe,
title, tabel meta (bidang, jenis, kelas, durasi, semester, TA, guru BK), lalu
section A–E dengan `white-space: pre-wrap` supaya paragraf-paragraf kegiatan
tidak kehilangan format.

Format ini langsung siap dikumpulkan sebagai bukti perencanaan layanan saat
supervisi oleh kepala sekolah atau pengawas BK.

---

## Bab 3 — Laporan Bulanan: Rekap Satu Halaman

### Filosofi

Guru BK butuh **satu dokumen per bulan** untuk:
- Laporan ke kepala sekolah
- Laporan ke pengawas BK kabupaten
- Arsip fisik sekolah

Aplikasi tidak perlu dashboard laporan kompleks — yang penting **angka benar +
PDF printable**.

### `ReportController`

Dua method:
- `index()` → halaman web dengan filter bulan/tahun + summary cards
- `monthlyPdf()` → return `PdfService::inline(...)` dengan summary + details

### Query: `collectSummary()` & `collectDetails()`

`collectSummary` mengembalikan angka agregat per kategori. `collectDetails`
mengambil detail record dalam periode (untuk ditampilkan di PDF).

Filter tanggal konsisten:
- Kasus → `whereBetween('created_at', [$start, $end])`
- Layanan (konseling/klasikal/visit/referral/violation) → `whereBetween('date', [...])`
- Kasus selesai → `whereBetween('resolved_at', [...])` (agar hanya kasus yang
  ditutup dalam bulan ini yang dihitung, bukan yang dibuat bulan ini)

### PDF `report-monthly.blade.php`

Sembilan seksi:
- A. Ringkasan Utama (4 stat box)
- B. Kategori Kasus (5 stat box)
- C. Layanan Konseling (4 stat box)
- D. Rincian Kasus (tabel)
- E. Sesi Konseling (tabel)
- F. Bimbingan Klasikal (tabel)
- G. Home Visit (tabel)
- H. Pelanggaran Siswa (tabel)
- I. Referral (tabel)

Setiap seksi tabel pakai `@if(count(...) > 0)` — jadi kalau bulan tersebut
tidak ada kasus, seksi D tidak muncul. Laporan bulan sepi jadi tidak penuh
heading kosong.

Ada `empty-note` untuk kondisi ekstrem: semua angka 0 → tampilkan pesan
"Tidak ada aktivitas..." agar tidak bingung kenapa PDF kosong.

### UI filter: 2 dropdown + 1 tombol

`Reports/Index.tsx` tampilkan dropdown bulan (Januari–Desember) + dropdown
tahun (tahun ini - 2 s.d. tahun ini + 1) + tombol "Unduh PDF Rekap". Tombol
PDF adalah `<a>` ke URL dengan query string `?month=X&year=Y`, buka di tab
baru. Tidak pakai `router.get()` karena PDF bukan Inertia response.

---

## Bab 4 — Routes & RBAC

Di `routes/web.php`:

```php
// RPL BK
Route::middleware('module:program_rpl,read')->group(fn () =>
    Route::get('programs/rpl', [RplBkController::class, 'index'])->name('rpl.index')
);
Route::middleware('module:program_rpl,write')->group(function () {
    Route::post('programs/rpl', ...)->name('rpl.store');
    Route::put('programs/rpl/{rpl}', ...)->name('rpl.update');
    Route::delete('programs/rpl/{rpl}', ...)->name('rpl.destroy');
});
Route::middleware('module:program_rpl,read')->group(function () {
    Route::get('programs/rpl/{rpl}', ...)->name('rpl.show');
    Route::get('programs/rpl/{rpl}/pdf', ...)->name('rpl.pdf');
});

// Laporan
Route::middleware('module:reports,read')->group(function () {
    Route::get('reports', ...)->name('reports.index');
    Route::get('reports/monthly-pdf', ...)->name('reports.monthly-pdf');
});
```

### Slug modul

| Slug | Modul |
|------|-------|
| `program_rpl` | RPL BK |
| `reports` | Laporan |

(Slug `program_annual` & `program_semester` masih ada di `ModuleSeeder` untuk
kebutuhan berikutnya — tapi belum ada route.)

### Matriks RBAC

| Peran | RPL BK | Laporan |
|-------|--------|---------|
| Super Admin | R/W | R |
| Koordinator BK | R/W | R |
| Guru BK | R/W | R |
| Wali Kelas | — | — |
| Kepala Sekolah | R | R |

Kepala Sekolah bisa akses laporan sebagai supervisor — tapi tidak membuat RPL.

---

## Bab 5 — Sidebar: Link ke Menu Baru

Sidebar sudah ada sejak Fase 1:

```tsx
{
    label: 'Program BK',
    children: [
        { label: 'RPL BK', href: '/programs/rpl', permission: 'program_rpl' },
        { label: 'Program Tahunan', href: '/programs/annual', permission: 'program_annual' },
        { label: 'Program Semesteran', href: '/programs/semester', permission: 'program_semester' },
    ],
},
{
    label: 'Laporan',
    href: '/reports',
    permission: 'reports',
},
```

Link "Program Tahunan" & "Semesteran" belum fungsional — sidebar masih
menampilkan link tapi halaman belum dibuat. Saat guru BK mengklik, Laravel
akan 404 karena route tidak ada.

**Opsi cepat**: tambahkan redirect placeholder di routes, atau hapus children
sampai fitur siap. Sekarang saya biarkan karena belum urgent — user testing
akan mendorong prioritas.

---

## Bab 6 — TypeScript Interfaces

Tambah di `resources/js/types/index.ts`:

```ts
export interface RplBk {
    id: number;
    counselor_id: number;
    academic_year_id: number;
    title: string;
    bidang: 'pribadi' | 'sosial' | 'belajar' | 'karier';
    service_type: 'klasikal' | 'kelompok' | 'individual' | 'konsultasi';
    class_level: 'X' | 'XI' | 'XII' | 'semua';
    duration_minutes: number;
    objective: string;
    method: string | null;
    materials: string | null;
    activities: string | null;
    evaluation: string | null;
    semester: 'ganjil' | 'genap';
    created_at: string;
    counselor?: User;
    academic_year?: AcademicYear;
}
```

Dashboard punya beberapa interface inline (tidak perlu global): `Stats`,
`CaseTrendPoint`, `ClassRisk`, `AkpdBidang`, `CaseStatusPoint`, dll. Ditaruh di
`Dashboard.tsx` saja karena tidak dipakai di halaman lain.

---

## Bab 7 — Yang Belum Selesai & Rencana Lanjutan

### Yang ditunda dari scope awal Fase 6

1. **Program Tahunan** — generator dari AKPD/DCM → list RPL prioritas per bidang
2. **Program Semesteran** — pecah Program Tahunan menjadi 2 semester
3. **Laporan semesteran & tahunan** — baru laporan bulanan yang jadi
4. **Export Excel** — `maatwebsite/excel` sudah terinstall, belum dipakai
5. **Notifikasi email** — butuh SMTP config + template mail
6. **Portal siswa/orang tua** — butuh guard auth terpisah + UI parallel
7. **API Sanctum** — untuk integrasi dengan sismansaka / aplikasi lain

### Mengapa ditunda

- **Program Tahunan/Semesteran** kompleks secara data modeling dan UX:
  butuh JSON structure untuk plan-items yang linked ke RPL, dan UI drag-drop
  kalender bulanan. Butuh 1 fase terpisah ukuran Fase 4-5.
- **Notifikasi email** butuh SMTP aktif. Di environment Laragon dev tidak
  tersedia. Implementasi tanpa testing = risiko bug produksi. Tunda sampai
  infrastruktur siap.
- **Portal siswa** butuh `web_student` guard + login flow berbeda + session
  policy (siswa login lebih lama, auto-logout setelah isi angket). Butuh
  review keamanan khusus karena anak di bawah umur.

### Prioritas berikutnya (Fase 7?)

1. Program Tahunan generator (2–3 hari kerja)
2. Export Excel laporan bulanan (½ hari kerja)
3. Notifikasi email untuk SP1/SP2/SP3 pelanggaran (1 hari kerja, ada SMTP)

---

## Bab 8 — Perintah Penting

```bash
# Migrasi rpl_bk
php artisan migrate

# Install react-is (fix Recharts peer dep)
npm install react-is --legacy-peer-deps

# Build frontend (~2.5s, bundle Dashboard ~112 KB gzip)
npm run build

# Verifikasi routes
php artisan route:list --name=rpl
php artisan route:list --name=reports
```

---

## Penutup

Fase 6 core menutup **loop data-driven BK**: data siswa (Fase 2) → kasus &
pelanggaran (Fase 3) → layanan (Fase 4) → diagnosis instrumen (Fase 5) →
**dashboard visual + RPL terdokumentasi + laporan bulanan tercetak** (Fase 6).

Dari sini aplikasi sudah bisa dipakai di SMA Negeri 1 Kabanjahe untuk
operasional BK satu tahun penuh. Fitur lanjutan (Program Tahunan generator,
portal siswa, notifikasi) bisa ditambahkan secara inkremental tanpa
mempengaruhi fitur yang sudah ada.

Catatan penting saat go-live:
1. Ganti semua password default (admin, koorbk, gurubk1-3, kepsek) sebelum
   production.
2. Pastikan `APP_ENV=production` di `.env` dan storage link sudah dibuat.
3. Jalankan semua seeder default: modules, groups, access, users, TA, violations,
   AKPD items, DCM items.
4. Test workflow lengkap: tambah siswa → catat kasus → rekam konseling → cetak
   RPL → buat laporan bulanan PDF.
