<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ViolationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $violations = [
            // Ringan (1-25 poin)
            ['name' => 'Terlambat masuk sekolah', 'category' => 'ringan', 'points' => 5],
            ['name' => 'Tidak memakai seragam lengkap', 'category' => 'ringan', 'points' => 5],
            ['name' => 'Tidak mengerjakan tugas/PR', 'category' => 'ringan', 'points' => 5],
            ['name' => 'Membuat keributan di kelas', 'category' => 'ringan', 'points' => 10],
            ['name' => 'Membawa HP tanpa izin', 'category' => 'ringan', 'points' => 10],
            ['name' => 'Membolos jam pelajaran', 'category' => 'ringan', 'points' => 15],
            ['name' => 'Tidak hadir tanpa keterangan (alfa)', 'category' => 'ringan', 'points' => 10],
            ['name' => 'Berkata tidak sopan kepada teman', 'category' => 'ringan', 'points' => 15],
            ['name' => 'Merusak fasilitas sekolah (ringan)', 'category' => 'ringan', 'points' => 20],

            // Sedang (26-50 poin)
            ['name' => 'Berkelahi dengan teman', 'category' => 'sedang', 'points' => 30],
            ['name' => 'Bullying verbal/psikologis', 'category' => 'sedang', 'points' => 35],
            ['name' => 'Merokok di lingkungan sekolah', 'category' => 'sedang', 'points' => 40],
            ['name' => 'Membawa senjata tajam', 'category' => 'sedang', 'points' => 50],
            ['name' => 'Mencuri/mengambil barang milik orang lain', 'category' => 'sedang', 'points' => 40],
            ['name' => 'Memalsu tanda tangan orang tua/guru', 'category' => 'sedang', 'points' => 35],
            ['name' => 'Merusak fasilitas sekolah (berat)', 'category' => 'sedang', 'points' => 40],

            // Berat (>50 poin)
            ['name' => 'Terlibat narkoba', 'category' => 'berat', 'points' => 100],
            ['name' => 'Tawuran/kekerasan fisik serius', 'category' => 'berat', 'points' => 75],
            ['name' => 'Bullying fisik / intimidasi', 'category' => 'berat', 'points' => 75],
            ['name' => 'Pelecehan seksual', 'category' => 'berat', 'points' => 100],
            ['name' => 'Pencurian dengan kekerasan', 'category' => 'berat', 'points' => 75],
        ];

        foreach ($violations as $v) {
            \App\Models\Violation::firstOrCreate(
                ['name' => $v['name']],
                array_merge($v, ['is_active' => true])
            );
        }
    }
}
