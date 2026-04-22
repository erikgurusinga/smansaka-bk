# Buku Kedelapan — Penyelesaian Fase 6: Laporan Lengkap & Program Tahunan/Semesteran

*Dokumentasi lanjutan Fase 6 — menutup scope yang di Buku 7 ditandai ditunda. Selesai 2026-04-23.*

Buku 7 menyelesaikan **core Fase 6** (Dashboard, RPL BK, Laporan Bulanan). Buku
ini melanjutkan dengan:

- **P1** — Laporan semester & tahunan + Export Excel (sebelumnya hanya bulanan PDF)
- **P2** — Program Tahunan (generator dari AKPD) + Program Semesteran (jadwal mingguan)

Dengan Buku 8 ini, **checklist Fase 6 tinggal tersisa item yang butuh infrastructure
eksternal**: notifikasi email (SMTP), portal siswa/ortu (auth guard), API Sanctum.

---

## Bab 1 — Laporan: Dari Bulanan ke Universal

### Refactor `ReportController`

Dulu hanya `index()` + `monthlyPdf()`. Sekarang tiga method eksekusi dengan
satu pintu resolusi rentang waktu:

```php
public function index(Request $request): Response          // ke halaman web
public function pdf(Request $request): SymfonyResponse     // PDF (monthly/semester/yearly)
public function excel(Request $request): BinaryFileResponse // Excel
private function resolveRange($type, $year, $month, $semester): array // helper
```

`resolveRange()` adalah jantung refactor:

```php
match ($type) {
    'yearly'   => [jan 1, dec 31, "Tahun $year"],
    'semester' => semester === 'ganjil'
                    ? [jul 1, dec 31, "Sem Ganjil TA $year/..."]
                    : [jan 1, jun 30, "Sem Genap TA .../$year"],
    default    => [first of month, last of month, Indonesian month name],
}
```

### Satu template PDF untuk 3 tipe

`pdf/report-period.blade.php` menggantikan `report-monthly.blade.php` (yang
di-commit di Buku 7). Title-nya dynamic:

```blade
@php
    $titleText = match($type) {
        'yearly' => 'Laporan Tahunan Layanan BK',
        'semester' => 'Laporan Semester Layanan BK',
        default => 'Laporan Bulanan Layanan BK',
    };
@endphp
```

Rest of the template sama — 9 seksi A–I tetap dengan conditional show.
Subtitle mencantumkan rentang tanggal eksplisit sehingga laporan semester
genap TA 2026/2027 (Jan–Jun 2027) tidak bingung dengan laporan semester
ganjil TA 2026/2027 (Jul–Des 2026).

### Excel: 7 sheet per laporan

`MonthlyReportExport` adalah `WithMultipleSheets` (meski namanya "Monthly" —
sekarang dipakai untuk 3 tipe, penamaan kurang akurat tapi kami tidak rename
untuk menghindari break kompatibilitas lokal):

| Sheet | Isi |
|-------|-----|
| Ringkasan | Summary agregat + header sekolah |
| Kasus | Detail kasus baru |
| Konseling | Semua sesi konseling (individual + group) |
| Klasikal | Bimbingan klasikal |
| Home Visit | Kunjungan rumah |
| Pelanggaran | Pelanggaran siswa + poin |
| Referral | Rujukan eksternal |

Semua sheet punya header bold putih di atas background teal `#117481`. Guru
BK langsung bisa copy ke aplikasi lain atau diolah via pivot table.

### UI Reports: tab kontrol

Tiga tab di atas: **Bulanan | Semester | Tahunan**. Pilihan tab menentukan
dropdown mana yang muncul:

- Bulanan → dropdown Bulan (Jan–Des) + Tahun
- Semester → dropdown Semester (ganjil/genap) + Tahun
- Tahunan → hanya Tahun

Dua tombol unduh (PDF + Excel) membawa parameter `type`, `month`, `year`,
`semester` melalui `URLSearchParams`. Tombol adalah `<a href>` target `_blank`
(PDF) dan direct download (Excel) — bukan Inertia karena responsenya bukan
Inertia response.

### Filter kasus: mengapa `created_at` bukan `date`

Kasus di-filter via `created_at` karena tidak punya kolom `date` (kasus adalah
ongoing event, bukan single date). Tapi "kasus selesai" pakai `resolved_at`
supaya yang dihitung adalah kasus yang ditutup dalam periode, bukan yang
dibuat. Distinction penting untuk laporan manajerial.

---

## Bab 2 — Program Tahunan: Struktur JSON yang Fleksibel

### Skema `annual_programs`

```
id, academic_year_id, counselor_id, title, description,
status (draft|active|completed),
generation_source (manual|akpd|dcm),
items (JSON array), timestamps
```

`items` struktur (satu entry per bidang):

```json
{
    "bidang": "pribadi|sosial|belajar|karier",
    "priority": 1-5,
    "focus": "string narasi fokus layanan",
    "target_count": N,
    "rpl_ids": [1, 5, 9]
}
```

Kenapa JSON, bukan tabel terpisah `annual_program_items`?
- Satu program punya paling banyak 4 item (4 bidang).
- Order/field bisa berubah sesuai kebutuhan BK tanpa migrasi.
- Tidak pernah di-query individual — selalu di-load bersama program.

### Generator otomatis dari AKPD

Saat halaman Create, controller mengquery distribusi AKPD TA aktif:

```php
$counts = AkpdResponse::where('academic_year_id', $yearId)
    ->where('checked', true)
    ->join('instrument_akpd_items', ...)
    ->selectRaw('bidang, COUNT(*) as total')
    ->groupBy('bidang')
    ->pluck('total', 'bidang');
```

Lalu map ke priority berdasarkan persentase:

| Persentase dicentang | Priority | Target RPL |
|---------------------|----------|------------|
| ≥ 30% | 5 (sangat tinggi) | 4 |
| ≥ 20% | 4 | 3 |
| ≥ 10% | 3 | 2 |
| < 10% | 2 | 1 |

Frontend menampilkan kartu saran:

```
Pribadi    Sosial    Belajar    Karier
 32%        12%       8%         48%
 Prio 5     Prio 3    Prio 2     Prio 5
```

Tombol "Terapkan Saran" → populate form dengan focus template default per
bidang. Guru BK edit sesuai kebutuhan, lalu klik "Simpan Program".

**Penting**: saran tidak auto-submit. Ini tetap manual-review oleh guru BK —
aplikasi hanya menyarankan distribusi prioritas, bukan memutuskan.

### Form builder manual

Selain dari AKPD, user bisa `+ Tambah Item` untuk build dari nol. Tiap item
punya selector Bidang, number input Priority & Target, textarea Focus, dan
checkbox list RPL BK yang bidang-nya sama (auto-filter).

### Show page: turunan semester

Di halaman Show, section "Program Semester (Turunan)" menampilkan 0–2 kartu
untuk `semester === 'ganjil'` dan `'genap'`. Kalau salah satu belum ada,
tombol "Buat Semester Ganjil" / "Buat Semester Genap" muncul dengan
`?annual_program_id=X&semester=Y` di query string.

Pattern ini membedakan "belum ada" dari "sudah ada" tanpa perlu state
management tambahan.

---

## Bab 3 — Program Semesteran: Jadwal Mingguan

### Skema `semester_programs`

```
id, annual_program_id (FK cascade), semester (ganjil|genap),
title, notes, schedule (JSON), timestamps
UNIQUE (annual_program_id, semester)
```

UNIQUE constraint memastikan satu Program Tahunan tidak punya 2× semester
Ganjil. Enforcement di controller juga cek duplikasi sebelum insert:

```php
$exists = SemesterProgram::where('annual_program_id', $id)
    ->where('semester', $sem)->exists();
if ($exists) return back()->with('error', 'Sudah ada...');
```

### Schedule: struktur flat

```json
[
    {"month": 7, "week": 1, "rpl_id": 3, "class_level": "X", "notes": ""},
    {"month": 7, "week": 2, "rpl_id": 5, "class_level": "semua", "notes": ""}
]
```

Bukan `{month: {week: [...]}}` nested karena:
- Lebih mudah di-render (satu loop).
- Bisa punya multi-RPL per minggu (tinggal push dua entry dengan month+week sama).
- Sort dengan comparator `(a, b) => a.month - b.month || a.week - b.week`.

### Form: tabel builder

Halaman Create pakai grid `grid-cols-[60px,120px,80px,1fr,120px,auto]`:
- Nomor urut
- Dropdown Bulan (auto-filter sesuai semester: ganjil Jul–Des, genap Jan–Jun)
- Dropdown Minggu (1–5)
- Dropdown RPL (prefixed dengan `[bidang]` untuk kejelasan)
- Dropdown Kelas (X / XI / XII / semua)
- Tombol hapus

Tombol `+ Tambah Jadwal` di header section. Kalau TA belum punya RPL di
semester yang dipilih, tombol di-disable + peringatan merah.

### Show: group by month

Halaman Show mengelompokkan entry per bulan lalu urut minggu. Tiap bulan =
satu card. Di dalamnya list RPL + minggu + kelas target. Menyerupai kalender
kerja BK — guru BK tinggal buka halaman ini setiap minggu untuk tahu apa yang
harus dilaksanakan.

---

## Bab 4 — Routes Tambahan

```php
// Program Tahunan
Route::middleware('module:program_annual,read')->group(fn () =>
    Route::get('programs/annual', [AnnualProgramController::class, 'index'])->name('annual.index')
);
Route::middleware('module:program_annual,write')->group(function () {
    Route::get('programs/annual/create', ...)->name('annual.create');
    Route::post('programs/annual', ...)->name('annual.store');
    Route::get('programs/annual/{annual}/edit', ...)->name('annual.edit');
    Route::put('programs/annual/{annual}', ...)->name('annual.update');
    Route::delete('programs/annual/{annual}', ...)->name('annual.destroy');
});
Route::middleware('module:program_annual,read')->group(fn () =>
    Route::get('programs/annual/{annual}', ...)->name('annual.show')
);

// Program Semesteran
Route::middleware('module:program_semester,read')->group(fn () =>
    Route::get('programs/semester', ...)->name('semester.index')
);
Route::middleware('module:program_semester,write')->group(function () {
    Route::get('programs/semester/create', ...)->name('semester.create');
    Route::post('programs/semester', ...)->name('semester.store');
    Route::delete('programs/semester/{semester}', ...)->name('semester.destroy');
});
Route::middleware('module:program_semester,read')->group(fn () =>
    Route::get('programs/semester/{semester}', ...)->name('semester.show')
);

// Laporan (updated)
Route::middleware('module:reports,read')->group(function () {
    Route::get('reports', ...)->name('reports.index');
    Route::get('reports/pdf', ...)->name('reports.pdf');      // baru, universal
    Route::get('reports/excel', ...)->name('reports.excel');  // baru
});
```

Route `reports.monthly-pdf` di-drop (breaking change — tapi aman karena belum
dipakai selain dari halaman Reports/Index yang juga di-update).

---

## Bab 5 — Matriks Modul RBAC (sudah ada sejak awal)

| Peran | `program_annual` | `program_semester` | `reports` |
|-------|:---:|:---:|:---:|
| Super Admin | R/W | R/W | R |
| Koordinator BK | R/W | R/W | R |
| Guru BK | R/W | R/W | R |
| Wali Kelas | — | — | — |
| Kepala Sekolah | R | R | R |

Slug `program_annual` & `program_semester` sudah di-seed di `ModuleSeeder`
sejak Fase 1 (antisipasi). Seeder `GroupAccessSeeder` sudah include Guru BK
untuk kedua modul. Tidak perlu re-seed untuk halaman baru ini.

---

## Bab 6 — TypeScript Types

```ts
export interface AnnualProgramItem {
    bidang: 'pribadi' | 'sosial' | 'belajar' | 'karier';
    priority: number;
    focus: string;
    target_count: number;
    rpl_ids: number[];
}

export interface AnnualProgram { /* ... + items: AnnualProgramItem[] */ }

export interface SemesterScheduleItem {
    month: number; week: number; rpl_id: number;
    class_level: 'X' | 'XI' | 'XII' | 'semua';
    notes: string | null;
}

export interface SemesterProgram { /* ... + schedule: SemesterScheduleItem[] */ }
```

---

## Bab 7 — Yang Masih Ditunda

| Item | Blocker |
|------|---------|
| Notifikasi email (SP1/2/3, undangan konferensi) | SMTP belum dikonfigurasi |
| Portal siswa (isi AKPD/DCM mandiri) | Butuh `web_student` guard + review keamanan |
| Portal orang tua | Idem |
| API Sanctum untuk sismansaka | Butuh kesepakatan endpoint dengan tim sismansaka |

Semua di atas butuh **infrastructure** bukan sekadar code — SMTP relay,
kebijakan keamanan untuk minor, MoU antar-aplikasi. Ditunda sampai sekolah
siap.

---

## Bab 8 — Workflow End-to-End (verifikasi untuk go-live)

Urutan yang harus di-test oleh guru BK setelah deploy:

1. **Isi angket AKPD** beberapa siswa → halaman AKPD/Responses/Fill
2. **Susun Program Tahunan** → `/programs/annual/create` → lihat saran AKPD
   → Terapkan Saran → edit fokus → Simpan
3. **Buat beberapa RPL BK** untuk tiap bidang → `/programs/rpl` → Dialog CRUD
4. **Edit Program Tahunan** → kaitkan RPL ke tiap item bidang
5. **Buat Program Semester Ganjil** dari Show page → susun jadwal mingguan
6. **Catat aktivitas**: konseling, klasikal, home visit, kasus, pelanggaran
7. **Lihat Dashboard** → semua stat & chart terisi
8. **Cetak Laporan Bulanan PDF** + **Laporan Semester Excel** → verifikasi
   angka & format

Jika ke-8 langkah lancar, aplikasi siap handoff ke sekolah.

---

## Penutup

Fase 6 sekarang **lengkap kecuali item ber-infrastructure**. Loop aplikasi
data-driven BK tertutup rapi:

Data siswa → Kasus & Pelanggaran → Layanan (konseling/home visit) →
Instrumen (AKPD/DCM/Sosio/RIASEC) → **Program Tahunan & Semesteran** →
Eksekusi layanan → **Laporan & Dashboard**.

Langkah berikutnya (di luar ruang lingkup fase): operasional go-live, backup
harian, hardening keamanan, user training. Itu bukan pekerjaan pengembangan
— itu pekerjaan deployment & change management sekolah.
