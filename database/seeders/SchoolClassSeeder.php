<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        $yearId = AcademicYear::where('is_active', true)->value('id');

        // homeroom_teacher_id → user_id guru yang menjadi wali kelas
        // Menggunakan Teacher id 4–15 (guru mapel, bukan BK) — kosongkan dulu, isi via UI
        $classes = [
            // Kelas X
            ['name' => 'X-1', 'level' => 'X',   'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'X-2', 'level' => 'X',   'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'X-3', 'level' => 'X',   'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'X-4', 'level' => 'X',   'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],

            // Kelas XI
            ['name' => 'XI IPA 1', 'level' => 'XI',  'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'XI IPA 2', 'level' => 'XI',  'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'XI IPS 1', 'level' => 'XI',  'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'XI IPS 2', 'level' => 'XI',  'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],

            // Kelas XII
            ['name' => 'XII IPA 1', 'level' => 'XII', 'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'XII IPA 2', 'level' => 'XII', 'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'XII IPS 1', 'level' => 'XII', 'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
            ['name' => 'XII IPS 2', 'level' => 'XII', 'academic_year_id' => $yearId, 'homeroom_teacher_id' => null],
        ];

        foreach ($classes as $data) {
            SchoolClass::create($data);
        }
    }
}
