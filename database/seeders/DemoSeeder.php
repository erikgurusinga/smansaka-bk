<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder khusus DEMO PUBLIK.
 *
 * Mengisi database demo dengan struktur + data fiktif (semua nama/NIS karangan,
 * bukan data siswa asli). Dipanggil oleh `php artisan demo:reset` secara berkala.
 *
 * Untuk BK, data master (siswa/guru/kelas) memang sudah berupa data dummy
 * (NIS 2526xxx), jadi cukup memanggil rangkaian seeder standar. Bila kelak
 * data produksi memuat siswa asli, JANGAN tambahkan seeder data asli ke sini —
 * demo harus tetap 100% fiktif.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Struktur & akses
            ModuleSeeder::class,
            UserGroupSeeder::class,
            GroupAccessSeeder::class,
            UserSeeder::class,
            SettingSeeder::class,
            AcademicYearSeeder::class,

            // Referensi instrumen
            ViolationSeeder::class,
            AkpdItemSeeder::class,
            DcmItemSeeder::class,

            // Data fiktif (aman dipublikasikan)
            TeacherSeeder::class,
            SchoolClassSeeder::class,
            StudentSeeder::class,
            GuardianSeeder::class,
            StudentGuidanceSeeder::class,
        ]);
    }
}
