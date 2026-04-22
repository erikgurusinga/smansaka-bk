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
    └── 02-fondasi.md                   ← Buku Kedua: Fase 1 Fondasi
```

## Daftar Buku

| No | Judul | File |
|----|-------|------|
| 01 | Rancangan Aplikasi & Stack Teknologi | [books/01-rancangan-dan-teknologi.md](books/01-rancangan-dan-teknologi.md) |
| 02 | Fase 1 — Fondasi (scaffold, auth, RBAC, tema) | [books/02-fondasi.md](books/02-fondasi.md) |

## Catatan

- Setiap fase pengembangan akan menambah buku baru (mis. `02-fondasi.md`, `03-master-data.md`, dst.).
- Semua diagram arsitektur menggunakan **Mermaid** — otomatis dirender oleh viewer.
- Kode dalam buku otomatis di-*syntax highlight*.
