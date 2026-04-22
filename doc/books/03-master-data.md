# Buku 3 — Fase 2: Master Data

> Aplikasi Bimbingan & Konseling SMAN 1 Kabanjahe  
> Tanggal selesai: **2026-04-22**  
> Branch: `main`  
> Dikerjakan bersama Claude Code (claude-sonnet-4-6)

---

## Ringkasan Fase

Fase 2 membangun seluruh **lapisan data master** yang menjadi fondasi semua modul BK berikutnya.
Setelah fase ini selesai, operator dapat:

- Mengelola data kelas dan wali kelas
- Mengelola data guru (termasuk Guru BK)
- Mengelola data siswa lengkap dengan foto
- Mengimpor siswa dari Excel (format sismansaka/Dapodik)
- Mengelola data orang tua / wali
- Menugaskan siswa asuh ke Guru BK per tahun ajaran

---

## 1. Quality Gate (sudah tersedia sejak Fase 1)

Semua alat kualitas kode sudah terpasang di Fase 1 dan tetap aktif:

| Alat | Fungsi |
|---|---|
| Laravel Pint (`pint.json`) | Format PHP — preset Laravel + sorted imports |
| ESLint (`eslint.config.js`) | Lint TypeScript/TSX |
| Prettier | Format JS/TS/CSS |
| Husky + lint-staged | Pre-commit: Pint + Prettier + ESLint otomatis |

Pre-commit hook (`/.husky/pre-commit`) menjalankan `npx lint-staged` yang memformat semua file yang masuk staging.

---

## 2. Skema Database

### 2.1 Tabel `classes`

```sql
id          bigint PK
name        varchar(255)          -- "X IPA 1"
level       enum('X','XI','XII')
academic_year_id  FK academic_years
homeroom_teacher_id  FK users (nullable)
created_at, updated_at
```

### 2.2 Tabel `teachers`

```sql
id       bigint PK
nip      varchar unique nullable
name     varchar(255)
phone    varchar nullable
email    varchar nullable
is_bk    boolean default false   -- true = Guru BK
user_id  FK users nullable       -- akun login yang terhubung
created_at, updated_at
```

### 2.3 Tabel `students`

```sql
id          bigint PK
nis         varchar unique
nisn        varchar unique nullable
name        varchar(255)
gender      enum('L','P')
birth_place varchar nullable
birth_date  date nullable
address     text nullable
phone       varchar nullable
religion    varchar nullable
class_id    FK classes nullable
status      enum('aktif','lulus','keluar','pindah') default 'aktif'
created_at, updated_at
```

Foto siswa disimpan via **Spatie Media Library** — collection `photo` (single file).

### 2.4 Tabel `parents`

```sql
id         bigint PK
name       varchar(255)
relation   enum('ayah','ibu','wali')
phone      varchar nullable
email      varchar nullable
occupation varchar nullable
address    text nullable
created_at, updated_at
```

### 2.5 Tabel `student_parents` (pivot)

```sql
student_id  FK students (CASCADE DELETE)
parent_id   FK parents  (CASCADE DELETE)
PRIMARY KEY (student_id, parent_id)
```

### 2.6 Tabel `student_guidance` (pivot tiga kunci)

```sql
student_id       FK students
user_id          FK users          -- Guru BK
academic_year_id FK academic_years
PRIMARY KEY (student_id, user_id, academic_year_id)
```

---

## 3. Model Eloquent

### `SchoolClass` (`app/Models/SchoolClass.php`)

```php
protected $table = 'classes';
// Relasi: belongsTo(AcademicYear), belongsTo(User, 'homeroom_teacher_id'), hasMany(Student)
```

### `Teacher` (`app/Models/Teacher.php`)

```php
// Relasi: belongsTo(User)
// Cast: is_bk → boolean
```

### `Student` (`app/Models/Student.php`)

```php
// Implements HasMedia (Spatie MediaLibrary)
// registerMediaCollections: 'photo' single file
// Relasi: belongsTo(SchoolClass), belongsToMany(Guardian, 'student_parents'), 
//         belongsToMany(User, 'student_guidance') withPivot('academic_year_id')
```

### `Guardian` (`app/Models/Guardian.php`)

```php
protected $table = 'parents';
// Relasi: belongsToMany(Student, 'student_parents')
```

### `StudentGuidance` (`app/Models/StudentGuidance.php`)

```php
public $incrementing = false;
public $timestamps = false;
// Relasi: belongsTo(Student), belongsTo(User), belongsTo(AcademicYear)
```

---

## 4. Controllers

| Controller | Route prefix | Keterangan |
|---|---|---|
| `ClassController` | `/classes` | CRUD kelas + wali kelas |
| `TeacherController` | `/teachers` | CRUD guru, filter is_bk |
| `StudentController` | `/students` | CRUD siswa + foto + import Excel |
| `GuardianController` | `/parents` | CRUD orang tua / wali |
| `StudentGuidanceController` | `/student-guidance` | Penugasan siswa → Guru BK |

Semua controller menggunakan pola:
- `index()` → query + filter + paginate → `Inertia::render()`
- `store()` / `update()` → `$request->validate()` → model → `back()->with('success', ...)`
- `destroy()` → model → `back()->with('success', ...)`

---

## 5. Komponen UI Baru

Dibuat di `resources/js/Components/ui/`:

| Komponen | Deskripsi |
|---|---|
| `Select.tsx` | Radix Select — dropdown bergaya konsisten |
| `Textarea.tsx` | Textarea styled teal |
| `Badge.tsx` | Label warna: default/success/warning/danger/info/neutral |
| `Dialog.tsx` | Modal Radix Dialog — header + X close |
| `DeleteModal.tsx` | Konfirmasi hapus — Batal + Hapus |
| `Pagination.tsx` | Navigasi halaman + info "Menampilkan X–Y dari Z" |
| `PerPageSelect.tsx` | Pilihan 10/15/25/50/100 per halaman |
| `SearchInput.tsx` | Input pencarian dengan ikon kaca pembesar |
| `EmptyState.tsx` | State kosong dengan ikon + teks |

---

## 6. Halaman React (Inertia Pages)

### Pola yang dipakai di semua halaman CRUD:

1. **Toolbar**: SearchInput + filter Select(s) di kiri, PerPageSelect di kanan
2. **Tabel**: header uppercase tracking-wide, baris hover, badge status berwarna
3. **Aksi baris**: ikon pensil (edit) + tempat sampah (hapus) — muncul hanya jika `canWrite`
4. **Dialog create/edit**: react-hook-form + Zod validation, Select untuk dropdown
5. **DeleteModal**: konfirmasi sebelum hapus, tidak pakai `confirm()` native
6. **Toast**: Sonner untuk sukses/error
7. **Pagination**: komponen `<Pagination>` di bawah tabel

### `Classes/Index.tsx`
- Filter: pencarian nama, level (X/XI/XII), tahun ajaran
- Badge level berwarna (X=primary, XI=info, XII=success)
- Jumlah siswa per kelas dari `withCount('students')`

### `Teachers/Index.tsx`
- Filter: pencarian nama/NIP, status Guru BK
- Badge "Guru BK" / "Guru Mapel"
- Kolom Akun: username jika terhubung ke user

### `Students/Index.tsx`
- Filter: pencarian nama/NIS/NISN, kelas, status, jenis kelamin
- Foto avatar (klik untuk ganti foto)
- Tombol "Import Excel" di toolbar
- Dialog upload foto dengan preview
- Dialog import dengan petunjuk format kolom

### `Parents/Index.tsx`
- Filter: pencarian nama/telepon, hubungan (ayah/ibu/wali)
- Jumlah anak dari `withCount('students')`

### `StudentGuidance/Index.tsx`
- Tampilkan penugasan per tahun ajaran aktif
- Filter: Guru BK, pencarian nama siswa
- Dialog assign: pilih siswa belum terassign + pilih Guru BK
- Hapus penugasan individual

---

## 7. Import Excel Siswa

### File: `app/Imports/StudentsImport.php`

Menggunakan `maatwebsite/excel` dengan:
- `WithHeadingRow` — baris pertama adalah header
- `ToCollection` — proses seluruh baris sekaligus
- `WithValidation` — wajib ada kolom `nis` dan `nama`
- `updateOrCreate` berdasarkan `nis` — aman untuk import ulang

### Format Kolom Excel yang Didukung

| Kolom | Keterangan |
|---|---|
| `nis` | **Wajib** — NIS siswa |
| `nisn` | Opsional |
| `nama` | **Wajib** — nama lengkap |
| `jk` | L/P |
| `tempat_lahir` | Opsional |
| `tanggal_lahir` | Format Excel date atau string |
| `alamat` | Opsional |
| `telepon` | Opsional |
| `agama` | Opsional |
| `kelas` | Nama kelas — dicari di TA aktif |

---

## 8. Foto Siswa (Media Library)

- Collection: `photo` (single file, otomatis replace)
- Upload via `POST /students/{student}/photo`
- Validasi: `image|mimes:jpg,jpeg,png,webp|max:2048`
- URL: `$student->getFirstMediaUrl('photo')` dikirim ke frontend sebagai `photo_url`

---

## 9. RBAC

| Route | Modul | Ability |
|---|---|---|
| `GET /classes` | `classes` | read |
| `POST/PUT/DELETE /classes` | `classes` | write |
| `GET /teachers` | `classes` | read |
| `POST/PUT/DELETE /teachers` | `classes` | write |
| `GET /students` | `students` | read |
| `POST/PUT/DELETE /students` | `students` | write |
| `POST /students/import` | `students` | write |
| `POST /students/{id}/photo` | `students` | write |
| `GET /parents` | `parents` | read |
| `POST/PUT/DELETE /parents` | `parents` | write |
| `GET /student-guidance` | `students` | read |
| `POST/DELETE /student-guidance` | `students` | write |

---

## 10. Sidebar Navigation

Ditambahkan ke section **Master Data** di `AuthenticatedLayout.tsx`:

```
Master Data
├── Siswa Asuh          → /students       (perm: students)
├── Penugasan Siswa     → /student-guidance (perm: students)
├── Kelas & Wali        → /classes        (perm: classes)
├── Guru                → /teachers       (perm: classes)
├── Orang Tua           → /parents        (perm: parents)
└── Tahun Ajaran        → /academic-years (perm: academic_years)
```

---

## 11. Checklist Verifikasi

- [x] `php artisan migrate` — 6 migrasi baru berjalan tanpa error
- [x] `npm run build` — build bersih tanpa TypeScript error
- [x] `php artisan route:list` — semua route terdaftar
- [x] Modul `students`, `parents`, `classes` sudah ada di tabel `modules`
- [x] Build frontend: 310 KB JSX runtime + semua page bundle terpisah

---

## 12. Catatan Teknis

### Gotcha: `$table = 'parents'` adalah reserved word di MySQL
Penggunaan `parents` sebagai nama tabel aman di MySQL 8 (`INFORMATION_SCHEMA.TABLES` menggunakan `TABLE_NAME`), tetapi hindari menggunakannya tanpa backtick di raw SQL.

### Urutan migrasi FK
```
academic_years → classes (FK academic_year_id)
users → classes (FK homeroom_teacher_id)
classes → students (FK class_id)
students + parents → student_parents (FK keduanya)
students + users + academic_years → student_guidance (FK tiga)
```
Urutan timestamp migrasi sudah disesuaikan.

### Import Excel — tanggal dari Excel
Excel menyimpan tanggal sebagai angka serial. Gunakan:
```php
\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['tanggal_lahir'])
```
Jika nilai sudah berupa string (`"2008-05-14"`), cast langsung ke `date`.

---

*Buku ini merupakan catatan teknis Fase 2. Buku 4 akan mendokumentasikan Fase 3 (Buku Kasus & Pelanggaran).*
