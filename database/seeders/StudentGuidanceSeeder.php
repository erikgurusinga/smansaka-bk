<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentGuidanceSeeder extends Seeder
{
    public function run(): void
    {
        $yearId = AcademicYear::where('is_active', true)->value('id');

        // Pembagian kelas per guru BK
        // gurubk1 (user_id=3) → semua kelas X
        // gurubk2 (user_id=4) → semua kelas XI
        // gurubk3 (user_id=5) → semua kelas XII
        $assignment = [
            3 => 'X',
            4 => 'XI',
            5 => 'XII',
        ];

        foreach ($assignment as $userId => $level) {
            $classIds = SchoolClass::where('level', $level)
                ->where('academic_year_id', $yearId)
                ->pluck('id');

            $studentIds = Student::whereIn('class_id', $classIds)->pluck('id');

            $rows = $studentIds->map(fn ($studentId) => [
                'student_id'       => $studentId,
                'user_id'          => $userId,
                'academic_year_id' => $yearId,
            ])->toArray();

            DB::table('student_guidance')->insertOrIgnore($rows);
        }
    }
}
