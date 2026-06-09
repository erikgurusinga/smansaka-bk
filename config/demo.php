<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mode Demo
    |--------------------------------------------------------------------------
    |
    | Saat aktif, aplikasi berjalan sebagai DEMO PUBLIK:
    |  - Banner "Mode Demo" tampil di tiap halaman.
    |  - Kartu kredensial login ditampilkan di halaman masuk.
    |  - Aksi kritis (kelola user, ganti password, branding) diblokir.
    |  - Database direset berkala oleh perintah `php artisan demo:reset`.
    |
    | JANGAN aktifkan di lingkungan produksi yang berisi data asli.
    |
    */

    'enabled' => env('DEMO_MODE', false),

    /*
    | Identitas NETRAL untuk demo — menimpa branding sekolah asli.
    | Demo dijual ke sekolah lain, jadi TIDAK boleh menampilkan "SMAN 1 Kabanjahe".
    | Semua nilai placeholder; ganti sesuai merek SJHoster kapan saja.
    */
    'branding' => [
        'school_name' => env('DEMO_SCHOOL_NAME', 'SMA Negeri Demo'),
        'site_name' => env('DEMO_SITE_NAME', 'Sistem BK'),
        'site_short_name' => env('DEMO_SITE_SHORT', 'BK Demo'),
    ],

    /*
    | Label interval reset — hanya untuk ditampilkan ke pengunjung.
    | Jadwal sebenarnya diatur di routes/console.php.
    */
    'reset_interval_label' => env('DEMO_RESET_LABEL', 'setiap 2 jam'),

    /*
    | Akun yang ditampilkan di kartu kredensial halaman login.
    | Password di sini HARUS sama dengan yang diset di DemoSeeder.
    */
    'accounts' => [
        ['role' => 'Super Admin', 'username' => 'admin', 'password' => 'admin12345'],
        ['role' => 'Koordinator BK', 'username' => 'koorbk', 'password' => 'koorbk12345'],
        ['role' => 'Guru BK', 'username' => 'gurubk1', 'password' => 'gurubk1'],
        ['role' => 'Kepala Sekolah', 'username' => 'kepsek', 'password' => 'kepsek12345'],
    ],

    /*
    | Nama route yang DIBLOKIR untuk method tulis (POST/PUT/PATCH/DELETE)
    | saat mode demo aktif. Mendukung wildcard `*` (Str::is).
    | Tujuan: cegah pengunjung merusak akun login / branding demo.
    | Modul fungsional (siswa, kasus, konseling, dll.) sengaja DIBIARKAN
    | terbuka agar demo terasa nyata — datanya akan direset berkala.
    */
    'protected_routes' => [
        'system.users.*',
        'system.groups.*',
        'system.branding.*',
        'profile.password',
        'profile.photo',
        'profile.photo.remove',
    ],

];
