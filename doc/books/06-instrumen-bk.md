# Buku Keenam — Fase 5: Instrumen BK

*Dokumentasi implementasi fase instrumen BK untuk aplikasi smansaka-bk — selesai 2026-04-23.*

Fase 5 menambahkan empat jenis instrumen pengumpulan data BK: **AKPD** (Angket
Kebutuhan Peserta Didik), **DCM** (Daftar Cek Masalah), **Sosiometri**, dan
**Inventori Minat Bakat / Karier (RIASEC)**. Fase ini adalah "jantung diagnosis"
aplikasi — hasil instrumen inilah yang akan menjadi basis program tahunan &
semesteran BK di Fase 6.

## Ringkasan Cakupan

| Modul | Route prefix | Fungsi utama |
|-------|--------------|--------------|
| AKPD | `/instruments/akpd` | Angket 50 butir, 4 bidang (pribadi, sosial, belajar, karier) |
| DCM | `/instruments/dcm` | Daftar 240 butir, 12 topik masalah |
| Sosiometri | `/instruments/sociometry` | Pemetaan hubungan sosial kelas — sociogram SVG |
| Minat Bakat | `/instruments/career` | RIASEC Holland 48 butir skala 1-5 |

Seluruh modul mengikuti pola yang sama: **pool butir (bank soal)** → **pengisian
per siswa** → **hasil/analisis**. Untuk sosiometri pola sedikit berbeda karena
data-nya adalah pilihan relasi antar-siswa, bukan jawaban individu.

---

## Bab 1 — Desain Skema Database

Tujuh tabel baru ditambahkan di `database/migrations/2026_04_23_10000{0-6}_*`:

| Tabel | Isi |
|-------|-----|
| `instrument_akpd_items` | Bank butir AKPD (bidang, question, sort_order, is_active) |
| `instrument_akpd_responses` | Jawaban siswa: `UNIQUE(student, academic_year, item)` |
| `instrument_dcm_items` | Bank butir DCM (topic, topic_order, question, sort_order) |
| `instrument_dcm_responses` | Jawaban siswa: sama struktur dengan AKPD |
| `sociometry_sessions` | Sesi per kelas + criteria (JSON) + max_choices + status |
| `sociometry_choices` | Pilihan: session + from → to, criterion_key, polarity, rank |
| `career_assessments` | 1 record/siswa/TA: scores (JSON), dominant_codes, recommendations |

### Kenapa dua tabel untuk AKPD / DCM?

Pola **items + responses** memungkinkan dua hal:
1. Guru BK bisa mengubah/menambah butir tanpa mengubah migrasi.
2. Satu butir yang dihapus tidak menghapus history jawaban siswa lain (pakai
   `cascadeOnDelete` — tapi rekomendasi: set `is_active=false` saja).

UNIQUE `(student_id, academic_year_id, item_id)` memastikan siswa hanya punya
satu jawaban per butir per tahun ajaran. Pengisian ulang akan menghapus dulu
semua baris lama dalam transaksi, lalu `insert()` baris baru.

### Criteria sosiometri sebagai JSON

```php
'criteria' => 'array', // casts
```

Criteria di-JSON-kan supaya satu sesi bisa punya N kriteria arbitrary. Contoh
default:

```json
[
    {"key": "teman_dekat", "label": "Teman belajar bersama", "polarity": "positive"},
    {"key": "teman_bermain", "label": "Teman bermain/bercerita", "polarity": "positive"},
    {"key": "tidak_disukai", "label": "Teman yang kurang disukai", "polarity": "negative"}
]
```

Polarity `negative` berguna untuk mengidentifikasi siswa yang rawan diisolasi —
garis arah negatif di sociogram akan berwarna rose, positif sky.

### Signature fields bukan masalah di sini

Fase 4 butuh kolom `mediumText` untuk tanda tangan base64. Fase 5 tidak punya
field base64, jadi `text` standar sudah cukup.

---

## Bab 2 — Seeder: 50 + 240 Butir

### `AkpdItemSeeder.php` — 50 butir

Distribusi: 13 pribadi + 12 sosial + 13 belajar + 12 karier. Butir diambil dari
kebutuhan umum siswa SMA dari buku panduan BK (mis. "Saya sulit berkonsentrasi
saat belajar", "Saya bingung menentukan cita-cita").

Seeder pakai `updateOrCreate(['bidang', 'question'], [...])` supaya aman
di-rerun berkali-kali tanpa menduplikasi butir.

### `DcmItemSeeder.php` — 240 butir (12 topik × 20)

Topik standar POP BK Kemendikbud:

1. Kesehatan · 2. Keadaan Ekonomi · 3. Kehidupan Keluarga · 4. Agama dan Moral
5. Rekreasi dan Hobi · 6. Hubungan Sosial · 7. Kehidupan Sekolah · 8. Kebiasaan Belajar
9. Masa Depan / Cita-cita · 10. Penyesuaian Kurikulum · 11. Muda-Mudi · 12. Pribadi & Psikologis

### RIASEC — tanpa seeder DB

Inventori karier 48 butir (8 per dimensi × 6 dimensi R/I/A/S/E/C) **dikodekan
langsung di method `CareerController::bank()`**. Alasan:
- Tidak perlu di-CRUD: RIASEC adalah instrumen baku, bukan butir custom sekolah.
- Lebih ringan: tidak butuh query DB untuk setiap pengisian.

`CareerAssessment` menyimpan **skor agregat** (JSON dictionary `{R: 31, I: 24, …}`),
bukan per-butir. Jadi history per-jawaban tidak disimpan — hanya hasil
kalkulasi akhir + `dominant_codes` 3-huruf (mis. `SAI`).

---

## Bab 3 — AkpdController & DcmController

Kedua controller nyaris identik secara struktural. Method utama:

| Method | Fungsi |
|--------|--------|
| `items()` | List butir + filter bidang/topic + search + pagination |
| `storeItem() / updateItem() / destroyItem()` | CRUD butir (AKPD saja; DCM butir statis) |
| `responses()` | List siswa + `answered_count` withCount subquery |
| `fill()` | Form pengisian: semua butir + jawaban existing (jika ada) |
| `submit()` | Simpan: delete semua response lama, insert ulang dalam transaction |
| `result()` | Analisis per siswa: group by bidang/topic, hitung count & %-masalah |

### Pola submit: delete+insert dalam transaction

```php
DB::transaction(function () use ($student, $data, $rows) {
    AkpdResponse::where('student_id', $student->id)
        ->where('academic_year_id', $data['academic_year_id'])
        ->delete();
    AkpdResponse::insert($rows);
});
```

Tidak pakai `upsert` karena upsert MySQL tidak efisien untuk ratusan baris
dengan composite UNIQUE — sekaligus delete-all-lalu-insert lebih sederhana dan
transactional.

### `responses()` gunakan withCount subquery

```php
$query->withCount([
    'akpdResponses as answered_count' => fn ($q) => $q
        ->where('academic_year_id', $yearId)
        ->where('checked', true),
]);
```

Satu query dengan correlated subquery — lebih ringan daripada N+1 loop. Siswa
yang belum isi tetap muncul dengan `answered_count = 0`.

### DCM analisis: derajat masalah per topik

```tsx
const severityBadge = (pct) => {
    if (pct <= 10) return 'Ringan';
    if (pct <= 25) return 'Sedang';
    if (pct <= 50) return 'Cukup Berat';
    return 'Berat';
};
```

Ambang baku dari POP BK. Satu topik = 20 butir, jadi 50% = 10 masalah
tercentang dalam satu topik → kategori "Cukup Berat".

---

## Bab 4 — SociometryController: Relasi, Bukan Jawaban

Beda sosiometri dari AKPD/DCM: datanya bukan "setuju/tidak" terhadap pertanyaan,
melainkan **arah pilihan antar-siswa**. Struktur `SociometryChoice`:

```
(session_id, from_student_id) → to_student_id  [criterion_key, rank]
```

Rank digunakan jika `max_choices > 1`: rank=1 adalah pilihan pertama, rank=2
kedua, dst.

### Build statistik per kriteria di controller

```php
foreach ($session->criteria as $crit) {
    $inbound = $choices->where('criterion_key', $crit['key'])
        ->groupBy('to_student_id');
    foreach ($students as $s) {
        $stats[$crit['key']][$s->id] = $inbound->get($s->id, collect())->count();
    }
}
```

Hasil: dictionary `stats[criterion_key][student_id] = jumlah_suara_diterima`.
Dikirim ke frontend supaya ukuran node & peringkat bisa langsung di-render.

### Submit: delete-all-lalu-insert per pemilih

Karena satu siswa bisa mengubah pilihannya, controller pertama hapus semua
pilihan dari siswa tersebut di sesi itu, lalu insert ulang payload.

---

## Bab 5 — CareerController & Algoritma RIASEC

### Scoring 3-huruf kode Holland

```php
$scores = ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0];
foreach ($data['answers'] as $id => $value) {
    $dim = $bank[$id - 1][0]; // 'R' | 'I' | ...
    $scores[$dim] += (int) $value; // skala 1-5
}

arsort($scores);
$dominantCodes = implode('', array_slice(array_keys($scores), 0, 3));
```

Max score per dimensi = 8 items × 5 = 40. Tiga dimensi tertinggi disusun jadi
3-huruf code (mis. `SAI` = Social-Artistic-Investigative).

### Rekomendasi jurusan

Map primary-letter → daftar jurusan (dari teori Holland):

- **R** (Realistic) → Teknik Mesin, Sipil, Pertanian, Otomotif, …
- **I** (Investigative) → Kedokteran, Farmasi, Ilmu Komputer, Statistika, …
- **A** (Artistic) → DKV, Seni Rupa, Sastra, Film, Arsitektur, …
- **S** (Social) → BK, Psikologi, Keperawatan, Pendidikan Guru, …
- **E** (Enterprising) → Manajemen, Hukum, HI, Administrasi Bisnis, …
- **C** (Conventional) → Akuntansi, Administrasi, Sistem Informasi, Perpajakan, …

Ini hanya rekomendasi awal — guru BK tetap melakukan konseling lanjutan untuk
memadukan dengan nilai akademik, minat keluarga, dan realita ekonomi.

---

## Bab 6 — Sociogram dengan SVG Native

Keputusan yang diambil: **pakai SVG manual, bukan `react-force-graph-2d`**.
Pertimbangan:

1. **Ringan**: force-graph membawa dependensi d3-force + canvas, ~200KB
   minified. SVG inline kami 0 KB tambahan.
2. **Cukup untuk kelas SMA**: kelas biasanya 25-36 siswa. Force-directed
   algorithm kelebihan kompleksitas — circular layout sudah cukup jelas.
3. **Aksesibilitas**: SVG native bisa di-print PDF, di-screenshot tanpa
   artefak, dan scraper HTML bisa membacanya.

### Layout circular

```tsx
function layoutCircle(students, stats, cx, cy, r) {
    return students.map((s, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
            received: stats?.[s.id] ?? 0,
        };
    });
}
```

Semua siswa di lingkaran besar. Garis pilihan = line dari x1,y1 (pemilih) ke
x2,y2 (dipilih) dengan `marker-end=arrow`. Ukuran node di-skala dari rasio
`received / maxReceived`. Node dengan ≥3 suara di-highlight warna penuh teal
(siswa populer); yang lain outline saja.

### Tab kriteria = re-render sociogram

State `activeKey` memutuskan criterion yang ditampilkan. Ganti tab = ganti
subset `choices` + warna stroke. Tidak perlu animasi — re-render murni.

---

## Bab 7 — Pola Halaman: Fill Instrumen

Tiga pola pengisian berbeda untuk 4 instrumen:

### AKPD — semua butir dalam 4 grup

Satu halaman dengan 4 kartu bidang. Siswa scroll, centang/uncentang. Sticky
bottom menampilkan progress "X dari 50 dicentang" + tombol Simpan.

### DCM — sidebar topic navigator

Dengan 240 butir, scroll-all-at-once tidak praktis. Pakai sidebar sticky kiri
dengan 12 topik; tiap klik ganti section tengah. Angka `c/total` per topik
menunjukkan berapa yang sudah tercentang — guru BK / siswa bisa cepat cek mana
yang terlewat.

### RIASEC — skala 1-5 per butir

Butir individual, tiap butir punya 5 tombol (1=Tidak suka, 2=Kurang, 3=Netral,
4=Suka, 5=Sangat suka). Tombol aktif di-highlight teal. Perhitungan dilakukan
backend saat submit — hasil ditampilkan di halaman Result terpisah.

### Sociometry Fill — dropdown teman per rank

Per kriteria, N dropdown (N = max_choices). Tiap dropdown menampilkan
teman-teman sekelas *kecuali diri sendiri dan yang sudah dipilih di rank
lain di kriteria yang sama* — filter anti-duplikasi inline.

---

## Bab 8 — Halaman Result: Visualisasi Analisis

| Halaman | Visual utama |
|---------|-------------|
| AKPD Result | 4 kartu gauge bidang + daftar rincian per bidang |
| DCM Result | 12 progress-bar per topik dengan badge derajat (Ringan/Sedang/Berat) |
| Sociometry Show | SVG sociogram + tab kriteria + peringkat top-10 |
| Career Result | Header kode Holland besar (`SAI`) + 6 progress-bar dimensi + rekomendasi |

### Warna konsisten

| Warna | Arti |
|-------|------|
| Teal (primary) | Hasil positif / terbanyak |
| Sky / Info | Tingkat "sedang" atau kriteria positif |
| Amber / Warning | Perlu perhatian |
| Rose / Danger | Kritis / kriteria sosiometri negatif |
| Emerald / Success | Ringan / aman |

Pola ini sama dengan Fase 3-4 supaya pengguna tidak perlu mempelajari legenda
warna baru.

---

## Bab 9 — Routes & Module Slugs

Slug di `ModuleSeeder.php`:

| Slug | Modul |
|------|-------|
| `instrument_akpd` | AKPD |
| `instrument_dcm` | DCM |
| `instrument_sociometry` | Sosiometri |
| `instrument_career` | Minat Bakat |

Route ditambahkan di `routes/web.php` dengan pola yang sama dengan Fase 3-4:
- Route literal (`create`, `items`, `responses`) sebelum wildcard (`{model}`).
- Middleware `module:slug,read|write` per group.
- Prefix `instruments/{akpd,dcm,sociometry,career}`.

### Route names ringkas

| Route name | Path |
|------------|------|
| `akpd.items` | GET /instruments/akpd/items |
| `akpd.responses` | GET /instruments/akpd/responses |
| `akpd.fill` | GET /instruments/akpd/{student}/fill |
| `akpd.result` | GET /instruments/akpd/{student}/result |
| `dcm.*` | idem untuk DCM |
| `sociometry.index / show / create / fill / submit` | sesi sosiometri |
| `career.index / fill / result / submit` | asesmen karier |

---

## Bab 10 — RBAC: Siapa Bisa Apa

Di `GroupAccessSeeder.php`:

| Peran | AKPD | DCM | Sosio | Karier |
|-------|------|-----|-------|--------|
| Super Admin | R/W | R/W | R/W | R/W |
| Koordinator BK | R/W | R/W | R/W | R/W |
| Guru BK | R/W | R/W | R/W | R/W |
| Wali Kelas | — | — | — | — |
| Kepala Sekolah | R | R | R | R |

Wali kelas tidak diberi akses instrumen karena data ini bagian dari assessment
BK — kalau perlu analisis kelas, wali kelas bisa dapat ringkasan dari guru BK
(fase laporan di Fase 6).

---

## Bab 11 — TypeScript Interfaces

Di `resources/js/types/index.ts`:

```ts
export interface AkpdItem { id, bidang, question, sort_order, is_active }
export interface DcmItem { id, topic, topic_order, question, sort_order, is_active }
export interface SociometryCriterion { key, label, polarity }
export interface SociometrySession { id, class_id, criteria[], max_choices, ... }
export interface SociometryChoice { id, session_id, from_student_id, to_student_id,
    criterion_key, polarity, rank }
export interface CareerAssessment { id, student_id, scores (JSON), dominant_codes,
    recommendations, notes, completed_at, ... }
```

`Student` mendapat 3 relasi baru: `akpd_responses`, `dcm_responses`,
`career_assessments` (untuk `with()` lookup).

---

## Bab 12 — Sidebar Update

Submenu "Instrumen" di `AuthenticatedLayout.tsx` sudah punya 4 link sejak Fase
1. Di Fase 5, href disesuaikan ke landing-page praktis:

- AKPD / DCM → `/instruments/{slug}/responses` (bukan `/instruments/{slug}` yang
  tidak ada).
- Sosiometri / Karier → tetap `/instruments/{slug}` karena Index-nya jelas.

Dari halaman Responses, tombol "Kelola Butir" mengarah ke `items` page. Dari
items, tombol "Lihat Respons Siswa" mengarah balik. Toggling gampang.

---

## Bab 13 — Apa yang Ditunda & Dipikir Ulang

### Ditunda ke Fase 6

- **Import AKPD bulk** via Excel: belum. Sekarang pengisian satu-per-satu.
- **Analisis kelas**: hanya per-siswa. Rekap agregat per kelas (topik masalah
  dominan, urutan prioritas program) akan ditangani dashboard Fase 6.
- **Angket online via link share**: siswa isi mandiri tanpa login guru.
  Butuh Fase 6 portal siswa.
- **PDF hasil instrumen** (printable report): belum. Bisa ditambahkan cepat
  mengikuti pola `PdfService::inline(...)` dari Fase 4.

### Dipikirkan ulang

- Mau pakai `react-force-graph-2d` untuk sosiometri — **dibatalkan**, pakai SVG
  manual (lihat Bab 6).
- Mau buat tabel `career_items` terpisah seperti AKPD — **tidak jadi**, inline
  di controller. RIASEC adalah instrumen baku yang jarang diubah.
- Mau pakai `dangerouslySetInnerHTML` untuk render skor bar — **tidak**, pakai
  Tailwind `width: ${pct}%` lebih aman.

---

## Bab 14 — Ringkasan Perintah

```bash
# Migrasi Fase 5
php artisan migrate

# Seed bank butir (aman dipanggil ulang)
php artisan db:seed --class=AkpdItemSeeder
php artisan db:seed --class=DcmItemSeeder

# Update permission Guru BK (sudah auto-include instrumen)
php artisan db:seed --class=GroupAccessSeeder

# Build frontend
npm run build

# Verifikasi: 50 AKPD + 240 DCM
php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap(); echo App\\Models\\AkpdItem::count() . ' AKPD, ' . App\\Models\\DcmItem::count() . ' DCM\\n';"
```

### Urutan pengembangan yang disarankan untuk fase selanjutnya

1. **Fase 6** — dashboard analitik & laporan: tarik data dari 4 instrumen ini
   → generate program tahunan / semesteran otomatis.
2. Tambahkan export PDF hasil instrumen per siswa (untuk arsip fisik BK).
3. Portal siswa: biarkan siswa mengisi AKPD/DCM sendiri dari akun mereka — ini
   pekerjaan terberat Fase 6 karena butuh auth siswa, guard terpisah, dan
   validasi kerahasiaan.

---

## Penutup

Fase 5 memberi aplikasi smansaka-bk **kemampuan diagnosis data-driven**. Tanpa
instrumen ini, program BK hanya berbasis intuisi guru. Dengan AKPD + DCM +
Sosio + RIASEC, aplikasi sekarang bisa menunjukkan angka konkret: "dari 35
siswa kelas X IPA 1, topik Kebiasaan Belajar punya rata-rata 52% masalah
(kategori Berat) — perlu RPL BK tentang manajemen waktu belajar".

Fase selanjutnya (Fase 6) akan mengangkat data mentah ini ke level laporan
bulanan/semester/tahunan dan dashboard analitik — titik tertinggi aplikasi.
