# Buku 4 — Fase 3: Buku Kasus & Poin Pelanggaran

> Aplikasi Bimbingan & Konseling SMAN 1 Kabanjahe  
> Tanggal selesai: **2026-04-22**  
> Branch: `main`  
> Dikerjakan bersama Claude Code (claude-sonnet-4-6)

---

## Ringkasan Fase

Fase 3 membangun dua pilar utama pencatatan BK: **Buku Kasus** dan **Poin Pelanggaran**.
Setelah fase ini selesai, Guru BK dapat:

- Mencatat kasus siswa dalam 5 kategori (akademik, pribadi, sosial, karier, pelanggaran)
- Mengelola workflow kasus: Baru → Penanganan → Selesai / Rujukan
- Menandai kasus sebagai rahasia (hanya terlihat oleh pihak tertentu)
- Mengelola master data jenis pelanggaran dengan sistem poin
- Mencatat pelanggaran siswa, memantau akumulasi poin, dan menetapkan level SP (SP1/SP2/SP3)

---

## 1. Desain Database

### 1.1 Tabel `violations` (Jenis Pelanggaran)

```sql
CREATE TABLE violations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category ENUM('ringan', 'sedang', 'berat') NOT NULL,
    points TINYINT UNSIGNED NOT NULL DEFAULT 0,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

Pembagian kategori berdasarkan batas poin:
- **Ringan**: 1–25 poin (membolos, seragam tidak lengkap, terlambat, dll)
- **Sedang**: 26–50 poin (berkelahi, merokok, membawa senjata, dll)
- **Berat**: >50 poin (narkoba, pelecehan seksual, tawuran serius, dll)

### 1.2 Tabel `cases` (Buku Kasus)

```sql
CREATE TABLE cases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,        -- FK → students
    reported_by BIGINT UNSIGNED NOT NULL,       -- FK → users (Guru BK)
    academic_year_id BIGINT UNSIGNED NOT NULL,  -- FK → academic_years
    category ENUM('akademik','pribadi','sosial','karier','pelanggaran') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('baru','penanganan','selesai','rujukan') NOT NULL DEFAULT 'baru',
    is_confidential TINYINT(1) NOT NULL DEFAULT 1,
    visible_to JSON NULL,                        -- array user_id yang boleh melihat
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

Catatan desain:
- `is_confidential = true` by default — kasus selalu dimulai sebagai rahasia
- `visible_to` adalah array JSON `[user_id, ...]` untuk membuka akses ke individu tertentu
- `resolved_at` diisi otomatis saat `status` berubah menjadi `'selesai'`

### 1.3 Tabel `student_violations` (Catatan Pelanggaran Siswa)

```sql
CREATE TABLE student_violations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,        -- FK → students
    violation_id BIGINT UNSIGNED NOT NULL,      -- FK → violations
    reported_by BIGINT UNSIGNED NOT NULL,       -- FK → users
    academic_year_id BIGINT UNSIGNED NOT NULL,  -- FK → academic_years
    date DATE NOT NULL,
    description TEXT NULL,
    status ENUM('baru','diproses','selesai') NOT NULL DEFAULT 'baru',
    sp_level ENUM('SP1','SP2','SP3') NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

---

## 2. Model Eloquent

### 2.1 `Violation`

```php
// app/Models/Violation.php
protected $fillable = ['name', 'category', 'points', 'description', 'is_active'];
protected $casts = ['is_active' => 'boolean', 'points' => 'integer'];

public function studentViolations(): HasMany
{
    return $this->hasMany(StudentViolation::class);
}
```

### 2.2 `CaseRecord`

Model ini menggunakan nama `CaseRecord` bukan `Case` karena `case` adalah **reserved keyword** di PHP.
Tabel tetap bernama `cases` via `protected $table = 'cases'`.

```php
// app/Models/CaseRecord.php
use Spatie\Activitylog\LogsActivity;
use Spatie\Activitylog\Traits\LogsActivity as LogsActivityTrait;

protected $table = 'cases';
protected $casts = [
    'is_confidential' => 'boolean',
    'visible_to'      => 'array',
    'resolved_at'     => 'datetime',
];

// Scope kerahasiaan — dikombinasikan di setiap query
public function scopeVisibleTo(Builder $query, $user): Builder
{
    if ($user->id === 1 || in_array('koordinator_bk', $user->groupSlugs())) {
        return $query; // super admin & koordinator BK lihat semua
    }
    return $query->where(function ($q) use ($user) {
        $q->where('reported_by', $user->id)
          ->orWhere('is_confidential', false)
          ->orWhereJsonContains('visible_to', $user->id);
    });
}
```

Activity log dikonfigurasi untuk merekam perubahan `status` dan `is_confidential`.

### 2.3 `StudentViolation`

```php
// app/Models/StudentViolation.php
protected $fillable = [
    'student_id', 'violation_id', 'reported_by', 'academic_year_id',
    'date', 'description', 'status', 'sp_level', 'notes',
];
protected $casts = ['date' => 'date'];
```

---

## 3. Seeder Jenis Pelanggaran

`ViolationSeeder` memuat 21 jenis pelanggaran default yang mencakup spectrum pelanggaran umum SMA:

| Kategori | Contoh | Poin |
|---|---|---|
| Ringan | Terlambat masuk sekolah | 5 |
| Ringan | Membolos jam pelajaran | 15 |
| Ringan | Merusak fasilitas (ringan) | 20 |
| Sedang | Berkelahi dengan teman | 30 |
| Sedang | Merokok di lingkungan sekolah | 40 |
| Sedang | Membawa senjata tajam | 50 |
| Berat | Tawuran/kekerasan fisik serius | 75 |
| Berat | Terlibat narkoba | 100 |
| Berat | Pelecehan seksual | 100 |

Seeder menggunakan `firstOrCreate` sehingga aman dijalankan berulang.

Jalankan:
```bash
php artisan db:seed --class=ViolationSeeder
```

---

## 4. Controller

### 4.1 `CaseController`

Route resource penuh: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`.

Fitur penting:
- `index()` — menggunakan `->visibleTo($user)` scope sehingga tiap user hanya melihat kasus yang relevan
- `show()` — ada **double check** akses manual (scope + middleware) untuk mencegah direct URL bypass
- `store()` — `reported_by` diset otomatis dari `Auth::id()`, `status` mulai dari `'baru'`
- `update()` — jika status berubah menjadi `'selesai'`, `resolved_at` diisi `now()` secara otomatis

### 4.2 `ViolationController`

Route: `index`, `store`, `update`, `destroy` (tanpa halaman create/edit terpisah — pakai dialog).

Fitur penting:
- `destroy()` — menolak hapus jika jenis pelanggaran sudah pernah digunakan (`studentViolations()->exists()`)
- `index()` — `withCount('studentViolations')` untuk menampilkan kolom "Pemakaian"

### 4.3 `StudentViolationController`

Route: `index`, `store`, `update`, `destroy`.

Fitur penting — **akumulasi poin per siswa**:
```php
$pointSummary = StudentViolation::query()
    ->where('academic_year_id', $activeYear->id)
    ->join('violations', 'violations.id', '=', 'student_violations.violation_id')
    ->selectRaw('student_id, SUM(violations.points) as total_points')
    ->groupBy('student_id')
    ->pluck('total_points', 'student_id')
    ->toArray();
```
Hasilnya dikirim ke frontend sebagai `point_summary: Record<student_id, total_points>`.

---

## 5. Routes

### Desain Pemisahan Akses

Semua route Fase 3 dilindungi middleware `module:X,read` (untuk GET) dan `module:X,write` (untuk POST/PUT/DELETE).

```php
// cases — perlu route ordering yang benar!
Route::middleware('module:cases,read')->group(function () {
    Route::get('cases', [CaseController::class, 'index'])->name('cases.index');
});
Route::middleware('module:cases,write')->group(function () {
    Route::get('cases/create', ...)->name('cases.create'); // SEBELUM cases/{case}
    Route::post('cases', ...);
    Route::get('cases/{case}/edit', ...);
    Route::put('cases/{case}', ...);
    Route::delete('cases/{case}', ...);
});
Route::middleware('module:cases,read')->group(function () {
    Route::get('cases/{case}', ...)->name('cases.show'); // SETELAH cases/create
});
```

> **Catatan penting:** Route `cases/create` harus didaftarkan **sebelum** `cases/{case}`.
> Jika terbalik, Laravel akan mencocokkan "create" sebagai parameter `{case}` dan mencari kasus dengan ID "create".

---

## 6. Halaman React

### 6.1 `Pages/Cases/Index.tsx`

Halaman daftar kasus dengan:
- Filter: search (judul/nama siswa), kategori, status, tahun ajaran
- Tabel: siswa, kelas, kategori (badge warna), judul, status (badge), kerahasiaan (Lock/Unlock icon), tanggal
- Aksi: View (Eye icon → halaman Show), Edit (Pencil → halaman Edit), Delete (modal konfirmasi)
- Tombol "Catat Kasus" → navigasi ke halaman Create

### 6.2 `Pages/Cases/Create.tsx`

Form pencatatan kasus baru:
- Pilih siswa (Select dengan NIS)
- Tahun ajaran read-only (diambil dari tahun ajaran aktif)
- Kategori & judul
- Textarea uraian kasus (5 baris)
- Checkbox kerahasiaan (default checked/rahasia)

### 6.3 `Pages/Cases/Show.tsx`

Halaman detail kasus:
- Badge status + ikon kerahasiaan di header
- Card siswa (nama + kelas)
- Card detail (kategori, pelapor, tanggal, tanggal selesai jika ada)
- Textarea uraian dengan `whitespace-pre-wrap`
- Tombol aksi cepat: "Proses" (baru → penanganan), "Tandai Selesai", "Edit"

### 6.4 `Pages/Cases/Edit.tsx`

Form edit kasus — hanya field yang boleh diubah (bukan siswa atau tahun ajaran):
- Kategori, Status (dropdown)
- Judul, Uraian
- Checkbox kerahasiaan

### 6.5 `Pages/Violations/Index.tsx`

Halaman master data jenis pelanggaran (CRUD penuh via Dialog):
- Filter: search, kategori
- Tabel: nama, kategori (badge warna), poin, pemakaian (count), status aktif
- Dialog create/edit dengan field: nama, kategori, poin (1–100), keterangan, checkbox aktif
- Hapus diblokir jika sudah dipakai

### 6.6 `Pages/StudentViolations/Index.tsx`

Halaman paling kompleks di Fase 3:
- Filter: search, kategori, status, SP level, tahun ajaran
- Tabel: siswa/kelas, jenis pelanggaran + badge kategori, tanggal, poin kejadian, **total poin TA aktif** (dengan warna merah jika ≥75), SP level (badge warna berbeda per level), status
- Dialog catat pelanggaran baru: siswa, jenis pelanggaran, tanggal, SP opsional, keterangan
- Dialog edit: tanggal, SP, status penanganan, catatan tindak lanjut
- Indikator peringatan (ikon AlertTriangle) saat total poin ≥ 75

---

## 7. Sistem Kerahasiaan

Kerahasiaan diimplementasikan di **dua lapis**:

### Lapis 1 — Eloquent Scope

```php
// Dipanggil di setiap query pada CaseController::index()
$query->visibleTo($user);
```

| Peran | Yang Terlihat |
|---|---|
| Super Admin (id=1) | Semua kasus |
| Koordinator BK | Semua kasus |
| Guru BK | Kasus yang dia catat + kasus publik + kasus di visible_to-nya |
| Wali Kelas | Kasus publik saja |
| Kepala Sekolah | Kasus publik saja (belum ada override) |

### Lapis 2 — Manual Check di `show()`

```php
if ($case->is_confidential
    && $case->reported_by !== $user->id
    && !$user->isSuperAdmin()
    && !in_array('koordinator_bk', $user->groupSlugs())
    && !in_array($user->id, $case->visible_to ?? [])
) {
    abort(403, 'Anda tidak memiliki akses ke catatan ini.');
}
```

Ini mencegah pengguna mengakses URL langsung (`/cases/123`) untuk kasus yang bukan miliknya.

---

## 8. Akumulasi Poin dan Eskalasi SP

### Cara Kerja Poin

Setiap `student_violation` tidak menyimpan poin — poin diambil dari tabel `violations` saat dibutuhkan.
Akumulasi dihitung fresh di setiap request `StudentViolationController::index()` via raw SQL aggregate.

Ini memastikan:
- Jika admin mengubah poin suatu jenis pelanggaran, akumulasi otomatis berubah
- Tidak ada state yang bisa out-of-sync

### Threshold Warna di Frontend

| Total Poin TA | Warna Indikator |
|---|---|
| 0–24 | Abu-abu (normal) |
| 25–49 | Amber (perhatian) |
| 50–74 | Orange (waspada) |
| ≥75 | Merah + ikon peringatan |

### Level Surat Peringatan (SP)

SP1, SP2, SP3 dicatat per kejadian pelanggaran, bukan otomatis dari akumulasi poin.
Ini sesuai dengan praktik sekolah di mana keputusan SP adalah pertimbangan Guru BK dan kepala sekolah,
bukan murni perhitungan angka.

---

## 9. Sidebar Navigation

Bagian "Kasus & Pelanggaran" di sidebar kini aktif dengan dua link tambahan:

```
Kasus & Pelanggaran
├── Buku Kasus           → /cases
├── Poin Pelanggaran     → /student-violations
├── Jenis Pelanggaran    → /violations
├── Konferensi Kasus     → /case-conferences  (fase selanjutnya)
└── Referral             → /referrals          (fase selanjutnya)
```

---

## 10. Checklist Fase 3

- [x] Migrasi: `violations`, `cases`, `student_violations`
- [x] Model `Violation` + `CaseRecord` (visibility scope + activity log) + `StudentViolation`
- [x] Seeder 21 jenis pelanggaran default
- [x] `ViolationController` — CRUD + proteksi hapus
- [x] `CaseController` — resource penuh + workflow + auto `resolved_at`
- [x] `StudentViolationController` — CRUD + akumulasi poin raw SQL
- [x] TypeScript types: `Violation`, `CaseRecord`, `StudentViolation`
- [x] `Pages/Violations/Index.tsx` — CRUD via Dialog
- [x] `Pages/Cases/Index.tsx`, `Create.tsx`, `Show.tsx`, `Edit.tsx`
- [x] `Pages/StudentViolations/Index.tsx` — akumulasi poin + badge SP
- [x] Routes: `cases`, `violations`, `student-violations` (read/write terpisah)
- [x] Sidebar: link Poin Pelanggaran + Jenis Pelanggaran aktif
- [x] Build frontend (`npm run build`) — zero errors
- [x] Commit & push ke GitHub

---

## Fase Berikutnya

**Fase 4 — Layanan BK** akan mengerjakan:
- Konseling individual (sesi, catatan, kerahasiaan)
- Konseling kelompok (sesi + peserta)
- Bimbingan klasikal (RPL BK)
- Home visit + PDF berita acara + tanda tangan digital
- Konferensi kasus + notulen + tanda tangan
- Referral + PDF surat rujukan
