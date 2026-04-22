# Buku 5 — Fase 4: Layanan BK

> Panduan lengkap implementasi modul Layanan BK: Konseling Individual, Konseling Kelompok, Bimbingan Klasikal, Home Visit (tanda tangan digital), Konferensi Kasus, dan Referral (PDF surat rujukan).

---

## Daftar Isi

1. [Gambaran Umum Fase 4](#1-gambaran-umum-fase-4)
2. [Database & Migrasi](#2-database--migrasi)
3. [Model Eloquent](#3-model-eloquent)
4. [Controller](#4-controller)
5. [Routes](#5-routes)
6. [Halaman React — Konseling Individual](#6-halaman-react--konseling-individual)
7. [Halaman React — Konseling Kelompok](#7-halaman-react--konseling-kelompok)
8. [Halaman React — Bimbingan Klasikal](#8-halaman-react--bimbingan-klasikal)
9. [Halaman React — Home Visit & Tanda Tangan Digital](#9-halaman-react--home-visit--tanda-tangan-digital)
10. [Halaman React — Konferensi Kasus](#10-halaman-react--konferensi-kasus)
11. [Halaman React — Referral](#11-halaman-react--referral)
12. [PDF mPDF — Berita Acara & Surat Rujukan](#12-pdf-mpdf--berita-acara--surat-rujukan)
13. [Arsitektur Keputusan](#13-arsitektur-keputusan)
14. [Checklist Fase 4](#14-checklist-fase-4)

---

## 1. Gambaran Umum Fase 4

Fase 4 menyelesaikan seluruh modul **Layanan BK** — inti operasional harian seorang Guru BK.
Total 6 modul dengan 6 tabel baru, 6 model, 6 controller, 18+ halaman React, dan 2 template PDF.

| Modul | Route Prefix | Keistimewaan |
|---|---|---|
| Konseling Individual | `/counseling/individual` | Log sesi per siswa, kerahasiaan, CRUD + status workflow |
| Konseling Kelompok | `/counseling/group` | Manajemen peserta multi-siswa (min 2), autocomplete search |
| Bimbingan Klasikal | `/counseling/classical` | CRUD inline (dialog modal), filter per kelas & TA |
| Home Visit | `/counseling/home-visit` | Tanda tangan digital (signature_pad), PDF berita acara |
| Konferensi Kasus | `/case-conferences` | Peserta dinamis (JSON array), notulen, outcome |
| Referral | `/referrals` | PDF surat rujukan, quick status update di halaman Show |

---

## 2. Database & Migrasi

### 2.1 `counseling_sessions` — Sesi Konseling (Individual + Kelompok)

```php
Schema::create('counseling_sessions', function (Blueprint $table) {
    $table->id();
    $table->enum('type', ['individual', 'group'])->default('individual');
    $table->foreignId('counselor_id')->constrained('users');
    $table->foreignId('academic_year_id')->constrained('academic_years');
    $table->date('date');
    $table->time('start_time')->nullable();
    $table->unsignedSmallInteger('duration_minutes')->nullable();
    $table->string('topic');
    $table->text('description')->nullable();
    $table->text('outcome')->nullable();
    $table->text('next_plan')->nullable();
    $table->enum('status', ['dijadwalkan','berlangsung','selesai','dibatalkan'])
          ->default('dijadwalkan');
    $table->boolean('is_confidential')->default(true);
    $table->timestamps();
});
```

**Desain key:** Satu tabel untuk Individual + Kelompok. Field `type` membedakannya. Ini menyederhanakan laporan lintas jenis konseling dan menghindari duplikasi schema.

### 2.2 `counseling_participants` — Pivot Peserta Kelompok

```php
Schema::create('counseling_participants', function (Blueprint $table) {
    $table->foreignId('counseling_session_id')
          ->constrained('counseling_sessions')->cascadeOnDelete();
    $table->foreignId('student_id')
          ->constrained('students')->cascadeOnDelete();
    $table->primary(['counseling_session_id', 'student_id']);
});
// Tidak ada timestamps — lookup pivot murni
```

### 2.3 `classical_guidance` — Bimbingan Klasikal

```php
$table->foreignId('counselor_id')->constrained('users');
$table->foreignId('class_id')->constrained('classes');
$table->foreignId('academic_year_id')->constrained('academic_years');
$table->date('date');
$table->string('topic');
$table->text('description')->nullable();
$table->string('method', 100)->nullable();  // Ceramah, diskusi, games...
$table->text('evaluation')->nullable();
$table->unsignedSmallInteger('duration_minutes')->nullable();
```

### 2.4 `home_visits` — Kunjungan Rumah

```php
$table->foreignId('student_id')->constrained('students');
$table->foreignId('counselor_id')->constrained('users');
$table->foreignId('academic_year_id')->constrained('academic_years');
$table->date('date');
$table->text('purpose');
$table->text('findings')->nullable();
$table->text('action_plan')->nullable();
$table->mediumText('signature_student')->nullable();   // Base64 PNG
$table->mediumText('signature_parent')->nullable();
$table->mediumText('signature_counselor')->nullable();
$table->enum('status', ['dijadwalkan', 'selesai'])->default('dijadwalkan');
```

**`mediumText` vs `text`:** Base64 PNG untuk tanda tangan bisa >65 KB — melebihi batas `TEXT` MySQL (64 KB). `MEDIUMTEXT` mendukung hingga 16 MB.

### 2.5 `case_conferences` — Konferensi Kasus

```php
$table->foreignId('case_id')->nullable()
      ->constrained('cases')->nullOnDelete();  // Opsional, tidak wajib
$table->foreignId('counselor_id')->constrained('users');
$table->foreignId('academic_year_id')->constrained('academic_years');
$table->date('date');
$table->string('topic');
$table->json('participants')->nullable();  // [{name, role}, ...]
$table->text('notes')->nullable();
$table->text('outcome')->nullable();
$table->enum('status', ['dijadwalkan', 'selesai'])->default('dijadwalkan');
```

**JSON participants:** Peserta konferensi bisa termasuk pihak eksternal (psikolog, orang tua, wali) yang bukan user sistem. JSON array `{name, role}` lebih fleksibel dari FK ke tabel users.

### 2.6 `referrals` — Rujukan

```php
$table->foreignId('student_id')->constrained('students');
$table->foreignId('case_id')->nullable()
      ->constrained('cases')->nullOnDelete();
$table->foreignId('counselor_id')->constrained('users');
$table->foreignId('academic_year_id')->constrained('academic_years');
$table->string('referred_to');  // Nama institusi/pihak yang menerima
$table->text('reason');
$table->date('date');
$table->text('notes')->nullable();
$table->enum('status', ['aktif','diterima','ditolak','selesai'])
      ->default('aktif');
```

---

## 3. Model Eloquent

### 3.1 `CounselingSession`

```php
protected $fillable = ['type','counselor_id','academic_year_id','date',
    'start_time','duration_minutes','topic','description','outcome',
    'next_plan','status','is_confidential'];
protected $casts = ['date'=>'date','is_confidential'=>'boolean'];

// Relations
public function counselor(): BelongsTo  // → User
public function academicYear(): BelongsTo
public function participants(): HasMany  // → CounselingParticipant
public function students(): BelongsToMany  // via counseling_participants
```

### 3.2 `CounselingParticipant`

```php
public $timestamps = false;
protected $fillable = ['counseling_session_id','student_id'];

public function session(): BelongsTo  // → CounselingSession
public function student(): BelongsTo
```

### 3.3 `HomeVisit`

```php
// Kunci: field tanda tangan disembunyikan by default
protected $hidden = ['signature_student','signature_parent','signature_counselor'];
```

Alasan: data base64 bisa mencapai ratusan KB. Serialisasi default (JSON untuk Inertia, API response) akan sangat boros jika selalu disertakan. Controller memanggil `makeVisible([...])` hanya di `show()` dan `pdf()`.

### 3.4 `CaseConference`

```php
protected $casts = ['date'=>'date','participants'=>'array'];
public function caseRecord(): BelongsTo  // → CaseRecord via case_id
```

Cast `participants` ke array memungkinkan akses langsung `$conference->participants` sebagai PHP array dari objek `{name, role}`.

---

## 4. Controller

### 4.1 `IndividualCounselingController`

- `index()`: filter `type='individual'`, paginate, with `students.schoolClass`, `counselor`, `academicYear`
- `store()`: set `type='individual'`, `counselor_id=Auth::id()`, buat record + 1 pivot peserta
- `update()`: update record + sync participant (hapus lama, insert baru)

```php
// store() — buat sesi + pivot peserta
$session = CounselingSession::create($data + [
    'type' => 'individual',
    'counselor_id' => Auth::id(),
]);
$session->participants()->create(['student_id' => $request->student_id]);
```

### 4.2 `GroupCounselingController`

- `store()`: validasi `student_ids` min:2, buat sesi + loop buat pivot
- `update()`: `participants()->delete()` lalu re-insert (sync sederhana)

```php
// update() — sync peserta
$session->participants()->delete();
foreach ($request->student_ids as $sid) {
    $session->participants()->create(['student_id' => $sid]);
}
```

### 4.3 `HomeVisitController`

```php
// show() — expose signatures untuk rendering
$homeVisit->makeVisible(['signature_student','signature_parent','signature_counselor']);

// pdf() — expose + render PDF
public function pdf(HomeVisit $homeVisit): SymfonyResponse
{
    $homeVisit->makeVisible([...]);
    $homeVisit->load(['student.schoolClass','counselor','academicYear']);
    return PdfService::inline('pdf.home-visit', ['visit' => $homeVisit], 'berita-acara');
}
```

### 4.4 `ReferralController`

```php
// pdf() — surat rujukan PDF
public function pdf(Referral $referral): SymfonyResponse
{
    $referral->load(['student.schoolClass','caseRecord','counselor','academicYear']);
    return PdfService::inline('pdf.referral', ['referral' => $referral], 'surat-rujukan');
}
```

---

## 5. Routes

Semua routes Fase 4 mengikuti pola: `create` harus terdaftar **sebelum** `{model}` untuk menghindari Laravel menafsirkan string "create" sebagai ID.

```php
// BENAR — create sebelum {session}
Route::middleware('module:counseling_individual,read')->group(function () {
    Route::get('counseling/individual', [...])->name('counseling.individual.index');
});
Route::middleware('module:counseling_individual,write')->group(function () {
    Route::get('counseling/individual/create', [...])->name('counseling.individual.create');
    // ... store, edit, update, destroy
});
Route::middleware('module:counseling_individual,read')->group(function () {
    Route::get('counseling/individual/{session}', [...])->name('counseling.individual.show');
});
```

| Modul | Module Slug | Route Prefix |
|---|---|---|
| Konseling Individual | `counseling_individual` | `counseling/individual` |
| Konseling Kelompok | `counseling_group` | `counseling/group` |
| Bimbingan Klasikal | `counseling_classical` | `counseling/classical` |
| Home Visit | `home_visit` | `counseling/home-visit` |
| Konferensi Kasus | `case_conferences` | `case-conferences` |
| Referral | `referrals` | `referrals` |

---

## 6. Halaman React — Konseling Individual

**4 halaman:** Index, Create, Show, Edit

### Index (`Pages/Counseling/Individual/Index.tsx`)
- Filter: search, status (dijadwalkan/berlangsung/selesai/dibatalkan), TA, per-page
- Kolom tabel: Siswa (nama + kelas), Topik (+ konselor), Tanggal (+ jam), Durasi, Status badge, Kerahasiaan (Lock/Unlock icon), Aksi (Eye/Pencil/Trash)
- Delete via modal konfirmasi

### Create (`Pages/Counseling/Individual/Create.tsx`)
- Select siswa dari daftar aktif
- Input: tanggal, jam mulai, durasi, status, topik
- Textarea: latar belakang, hasil, RTL
- Checkbox kerahasiaan (default: true)
- Hidden input `academic_year_id`

### Show (`Pages/Counseling/Individual/Show.tsx`)
- Card siswa + card detail sesi (tanggal, jam, durasi, konselor)
- Seksi: latar belakang, hasil/kesimpulan, RTL (amber)
- Quick action: "Tandai Selesai" (PUT update) + "Edit" button
- Lock/Unlock icon kerahasiaan

### Edit (`Pages/Counseling/Individual/Edit.tsx`)
- Identik Create tapi pre-filled, tanpa select siswa (siswa tidak bisa diubah)

---

## 7. Halaman React — Konseling Kelompok

**4 halaman:** Index, Create, Show, Edit

### Fitur Khas: Autocomplete Multi-Siswa

```tsx
// Pencarian real-time dari daftar props.students
const filteredStudents = students.filter(
    (s) =>
        !selectedStudents.find((sel) => sel.id === s.id) &&
        (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.nis.includes(studentSearch)),
);

// Chip tag untuk siswa yang sudah dipilih
<span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1">
    {s.name}
    <button onClick={() => removeStudent(s.id)}>
        <X className="h-3.5 w-3.5" />
    </button>
</span>
```

Validasi Zod: `student_ids: z.array(z.string()).min(2, 'Minimal 2 siswa...')`

---

## 8. Halaman React — Bimbingan Klasikal

**1 halaman:** Index (CRUD inline via Dialog modal — pola sama dengan Violations)

### Pola Dialog (tidak ada halaman Create/Edit terpisah)
```tsx
<Dialog
    open={dialog.open}
    onOpenChange={(open) => setDialog(d => ({ ...d, open }))}
    title={dialog.mode === 'create' ? 'Catat Bimbingan Klasikal' : 'Edit'}
>
    <form onSubmit={handleSubmit(onSubmit)}>
        {/* ... fields */}
    </form>
</Dialog>
```

Field `class_id` di-disabled saat edit (kelas tidak bisa diubah setelah dibuat).

---

## 9. Halaman React — Home Visit & Tanda Tangan Digital

**3 halaman:** Index, Create, Show

### Implementasi `signature_pad`

```tsx
import SignaturePad from 'signature_pad';

function SignatureField({ label, onSave }) {
    const canvasRef = useRef(null);
    const padRef = useRef(null);

    useEffect(() => {
        padRef.current = new SignaturePad(canvasRef.current, {
            penColor: '#1e293b',
        });
        // Kirim data URL ke form setiap selesai stroke
        padRef.current.addEventListener('endStroke', () => {
            onSave(padRef.current?.toDataURL());
        });
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={400} height={120}
            className="w-full touch-none rounded-xl border"
        />
    );
}

// Di form:
<SignatureField label="Tanda Tangan Siswa"
    onSave={(v) => setValue('signature_student', v)} />
```

### Show Page — Edit Tanda Tangan

Halaman Show mendukung edit tanda tangan tanpa pindah halaman:
- Jika sudah ada tanda tangan → tampilkan gambar `<img src={dataUrl}>` + tombol "Ubah"
- Klik "Ubah" → state `editing = true` → render canvas untuk tanda tangan baru
- Tombol "Simpan Tanda Tangan" → PUT update

---

## 10. Halaman React — Konferensi Kasus

**3 halaman:** Index, Create, Show

### Peserta Dinamis (Dynamic List)

```tsx
const [participants, setParticipants] = useState([{ name: '', role: '' }]);

// Di form — array peserta yang bisa ditambah/hapus
{participants.map((p, i) => (
    <div key={i} className="flex items-center gap-2">
        <Input placeholder="Nama" value={p.name}
            onChange={(e) => updateParticipant(i, 'name', e.target.value)} />
        <Input placeholder="Jabatan / Peran" value={p.role}
            onChange={(e) => updateParticipant(i, 'role', e.target.value)} />
        <button onClick={() => removeParticipant(i)}>
            <Trash2 />
        </button>
    </div>
))}

// Submit — filter peserta yang nama dan role-nya terisi
const validParticipants = participants.filter(p => p.name && p.role);
router.post(route('case-conferences.store'), { ...data, participants: validParticipants });
```

---

## 11. Halaman React — Referral

**3 halaman:** Index, Create, Show

### Quick Status Update di Show

```tsx
// Dropdown status langsung di halaman Show — tanpa dialog
{canWrite && (
    <div className="w-36">
        <Select
            value={referral.status}
            onValueChange={updateStatus}
            options={STATUS_OPTIONS}
        />
    </div>
)}

const updateStatus = (status) => {
    router.put(route('referrals.update', referral.id), {
        referred_to: referral.referred_to,
        reason: referral.reason,
        date: referral.date,
        notes: referral.notes,
        status,
    });
};
```

Pola ini menghindari keharusan membuka form Edit hanya untuk mengganti status.

---

## 12. PDF mPDF — Berita Acara & Surat Rujukan

Dua template PDF diletakkan di `resources/views/pdf/`.

### `pdf/home-visit.blade.php` — Berita Acara Kunjungan Rumah

- Header: nama sekolah + border bawah teal
- Info kunjungan: tabel dua kolom (label : nilai)
- Seksi: tujuan, temuan, RTL
- Tanda tangan: 3 kolom (siswa | ortu/wali | guru BK)
  - Render gambar base64: `<img src="{{ $visit->signature_student }}">` (mPDF mendukung data URL PNG)
  - Fallback: ruang kosong jika belum ditandatangani

### `pdf/referral.blade.php` — Surat Rujukan

- Header sekolah + bagian kiri
- Judul "SURAT RUJUKAN (REFERRAL)"
- Data siswa yang dirujuk
- Detail rujukan: institusi tujuan, tanggal, status badge
- Alasan rujukan + catatan
- Blok tanda tangan konselor (kanan bawah)

### Memanggil PDF dari Controller

```php
// PdfService::inline() — tampil di browser (bukan download)
return PdfService::inline('pdf.home-visit', ['visit' => $homeVisit], 'berita-acara-home-visit');
```

Di frontend — link biasa dengan `target="_blank"`:
```tsx
<a href={route('home-visits.pdf', visit.id)} target="_blank" rel="noopener noreferrer">
    <Button>Cetak Berita Acara</Button>
</a>
```

---

## 13. Arsitektur Keputusan

### A. Satu Tabel untuk Individual + Kelompok

Pilihan awal: tabel terpisah `individual_sessions` dan `group_sessions`.

**Dipilih:** satu tabel `counseling_sessions` + field `type`.

Alasan:
- Laporan gabungan (total sesi per konselor, per TA) tidak perlu UNION
- Shared fields (date, topic, description, outcome, status, is_confidential) sama persis
- Pivot `counseling_participants` sudah cukup untuk membedakan peserta

### B. Peserta Konferensi sebagai JSON

Pilihan awal: tabel `conference_participants` dengan FK ke users.

**Dipilih:** JSON array `{name, role}` di kolom `participants`.

Alasan:
- Peserta bisa orang luar (psikolog, pejabat dinas) yang tidak punya akun sistem
- Konferensi bersifat snapshot historis — tidak perlu live join ke tabel users
- Jauh lebih sederhana untuk CRUD form (dynamic list tanpa relasi)

### C. Tanda Tangan di `mediumText`

`TEXT` di MySQL = max 65.535 byte. Base64 PNG 400×120 pixel ≈ 15-40 KB, tapi bisa lebih besar tergantung kompleksitas coretan.

`MEDIUMTEXT` = max 16 MB — aman untuk semua kasus tanda tangan.

Field hidden by default di model (`$hidden`) dan di-expose via `makeVisible()` hanya di `show()` dan `pdf()`.

### D. Bimbingan Klasikal tanpa Halaman Terpisah

Konseling individual/kelompok punya navigasi Show → Edit → Delete yang cukup kompleks dan butuh halaman terpisah.

Bimbingan klasikal hanya butuh CRUD sederhana — pola Dialog inline (seperti Violations) lebih efisien: 1 halaman vs 3 halaman.

---

## 14. Checklist Fase 4

### Backend
- [x] 6 migrasi baru dibuat dan dijalankan
- [x] 6 model Eloquent dengan relasi lengkap
- [x] `HomeVisit::$hidden` untuk field tanda tangan
- [x] `CaseConference::$casts` participants → array
- [x] 6 controller dengan index/store/update/destroy minimal
- [x] `HomeVisitController::pdf()` + `ReferralController::pdf()`
- [x] Routes terstruktur (create sebelum {model} untuk menghindari konflik)
- [x] Semua routes dilindungi middleware `module:slug,read|write`

### Frontend
- [x] 4 halaman Konseling Individual (Index/Create/Show/Edit)
- [x] 4 halaman Konseling Kelompok (Index/Create/Show/Edit)
- [x] 1 halaman Bimbingan Klasikal (Index + Dialog CRUD)
- [x] 3 halaman Home Visit (Index/Create/Show) dengan signature_pad
- [x] 3 halaman Konferensi Kasus (Index/Create/Show)
- [x] 3 halaman Referral (Index/Create/Show)
- [x] TypeScript types untuk semua entitas Fase 4
- [x] Build zero error

### PDF
- [x] `resources/views/pdf/home-visit.blade.php` — berita acara kunjungan rumah
- [x] `resources/views/pdf/referral.blade.php` — surat rujukan

### Quality
- [x] ESLint + Prettier (via Husky pre-commit)
- [x] Laravel Pint (via Husky pre-commit)
- [x] Commit berhasil dengan semua hook lulus
