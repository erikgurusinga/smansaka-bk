# Dokumentasi Aplikasi BK SMANSAKA

Folder ini berisi semua dokumentasi proses pengembangan aplikasi **smansaka-bk**.
Setiap kegiatan penting (rancangan, keputusan teknis, panduan, laporan) akan kita
arsipkan di sini dalam bentuk **Markdown** supaya:

1. Mudah dibaca langsung di VSCode atau GitHub.
2. Bisa ditampilkan sebagai **web** melalui viewer bawaan (`index.html`).
3. Bisa **dicetak ke PDF** dengan satu klik dari viewer (tombol "Cetak PDF" di kanan atas).

## Cara membuka dokumentasi

### Cara 1 — Via browser (direkomendasikan)

1. Pastikan **Laragon** sedang berjalan.
2. Buka browser, kunjungi:
   ```
   http://localhost/smansaka-bk/doc/
   ```
3. Gunakan sidebar kiri untuk navigasi antar bab.
4. Klik tombol **"Cetak PDF"** di kanan atas untuk menyimpan sebagai PDF
   (pilih "Save as PDF" di dialog print browser).

### Cara 2 — Baca langsung di VSCode

- Buka file `.md` di folder `doc/books/`.
- Pakai **VSCode Markdown Preview** (`Ctrl+Shift+V`).

## Struktur Folder

```
doc/
├── README.md                       ← Anda sedang membaca ini
├── index.html                      ← Viewer web (buka via Laragon)
├── assets/
│   ├── style.css                   ← Gaya untuk tampilan layar
│   └── print.css                   ← Gaya untuk cetak PDF
└── books/
    ├── 01-rancangan-dan-teknologi.md   ← Buku Pertama: Rancangan & Teknologi
    ├── 02-fondasi.md                   ← Buku Kedua: Fase 1 Fondasi
    ├── 03-master-data.md               ← Buku Ketiga: Fase 2 Master Data
    ├── 04-buku-kasus.md                ← Buku Keempat: Fase 3 Buku Kasus & Pelanggaran
    ├── 05-layanan-bk.md                ← Buku Kelima: Fase 4 Layanan BK
    ├── 06-instrumen-bk.md              ← Buku Keenam: Fase 5 Instrumen BK
    ├── 07-program-dan-laporan.md       ← Buku Ketujuh: Fase 6 Program BK & Laporan (core)
    └── 08-laporan-dan-program.md       ← Buku Kedelapan: Fase 6 Lanjutan
```

## Daftar Buku

| No | Judul | File |
|----|-------|------|
| 01 | Rancangan Aplikasi & Stack Teknologi | [books/01-rancangan-dan-teknologi.md](books/01-rancangan-dan-teknologi.md) |
| 02 | Fase 1 — Fondasi (scaffold, auth, RBAC, tema) | [books/02-fondasi.md](books/02-fondasi.md) |
| 03 | Fase 2 — Master Data (siswa, kelas, guru, ortu, penugasan) | [books/03-master-data.md](books/03-master-data.md) |
| 04 | Fase 3 — Buku Kasus & Poin Pelanggaran | [books/04-buku-kasus.md](books/04-buku-kasus.md) |
| 05 | Fase 4 — Layanan BK (konseling, home visit, konferensi, referral) | [books/05-layanan-bk.md](books/05-layanan-bk.md) |
| 06 | Fase 5 — Instrumen BK (AKPD, DCM, Sosiometri, RIASEC) | [books/06-instrumen-bk.md](books/06-instrumen-bk.md) |
| 07 | Fase 6 — Program BK, Laporan & Dashboard Analitik (core) | [books/07-program-dan-laporan.md](books/07-program-dan-laporan.md) |
| 08 | Fase 6 Lanjutan — Laporan Semester/Tahunan + Excel + Program Tahunan/Semesteran | [books/08-laporan-dan-program.md](books/08-laporan-dan-program.md) |

## Catatan

- Setiap fase pengembangan akan menambah buku baru (mis. `02-fondasi.md`, `03-master-data.md`, dst.).
- Semua diagram arsitektur menggunakan **Mermaid** — otomatis dirender oleh viewer.
- Kode dalam buku otomatis di-*syntax highlight*.
