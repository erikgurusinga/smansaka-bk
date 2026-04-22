<?php

namespace Database\Seeders;

use App\Models\UserGroup;
use Illuminate\Database\Seeder;

class UserGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            ['slug' => 'super-admin', 'name' => 'Super Admin', 'description' => 'Akses penuh sistem', 'is_system' => true],
            ['slug' => 'koordinator-bk', 'name' => 'Koordinator BK', 'description' => 'Supervisi seluruh layanan BK', 'is_system' => true],
            ['slug' => 'guru-bk', 'name' => 'Guru BK', 'description' => 'Akses modul BK untuk siswa asuh sendiri', 'is_system' => true],
            ['slug' => 'wali-kelas', 'name' => 'Wali Kelas', 'description' => 'Lihat data publik siswa di kelasnya', 'is_system' => true],
            ['slug' => 'kepala-sekolah', 'name' => 'Kepala Sekolah', 'description' => 'Dashboard & laporan (read-only)', 'is_system' => true],
        ];

        foreach ($groups as $g) {
            UserGroup::updateOrCreate(['slug' => $g['slug']], $g);
        }
    }
}
