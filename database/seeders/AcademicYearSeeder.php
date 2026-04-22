<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        AcademicYear::updateOrCreate(
            ['year' => '2026/2027'],
            [
                'start_date' => '2026-07-15',
                'end_date' => '2027-06-30',
                'semester' => 'ganjil',
                'is_active' => true,
                'is_closed' => false,
                'notes' => 'Tahun ajaran aktif',
            ]
        );
    }
}
