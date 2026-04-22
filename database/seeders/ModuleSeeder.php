<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            // Inti
            ['name' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'layout-dashboard', 'parent_slug' => null, 'sort_order' => 10],

            // Master Data
            ['name' => 'Siswa Asuh', 'slug' => 'students', 'icon' => 'users', 'parent_slug' => 'master', 'sort_order' => 20],
            ['name' => 'Kelas & Wali', 'slug' => 'classes', 'icon' => 'user-cog', 'parent_slug' => 'master', 'sort_order' => 21],
            ['name' => 'Orang Tua', 'slug' => 'parents', 'icon' => 'users-2', 'parent_slug' => 'master', 'sort_order' => 22],
            ['name' => 'Tahun Ajaran', 'slug' => 'academic_years', 'icon' => 'calendar-days', 'parent_slug' => 'master', 'sort_order' => 23],

            // Layanan BK
            ['name' => 'Konseling Individual', 'slug' => 'counseling_individual', 'icon' => 'message-circle', 'parent_slug' => 'counseling', 'sort_order' => 30],
            ['name' => 'Konseling Kelompok', 'slug' => 'counseling_group', 'icon' => 'users-2', 'parent_slug' => 'counseling', 'sort_order' => 31],
            ['name' => 'Bimbingan Klasikal', 'slug' => 'counseling_classical', 'icon' => 'presentation', 'parent_slug' => 'counseling', 'sort_order' => 32],
            ['name' => 'Home Visit', 'slug' => 'home_visit', 'icon' => 'home', 'parent_slug' => 'counseling', 'sort_order' => 33],

            // Kasus & Pelanggaran
            ['name' => 'Buku Kasus', 'slug' => 'cases', 'icon' => 'book-open', 'parent_slug' => 'cases_group', 'sort_order' => 40],
            ['name' => 'Poin Pelanggaran', 'slug' => 'violations', 'icon' => 'shield-alert', 'parent_slug' => 'cases_group', 'sort_order' => 41],
            ['name' => 'Konferensi Kasus', 'slug' => 'case_conferences', 'icon' => 'gavel', 'parent_slug' => 'cases_group', 'sort_order' => 42],
            ['name' => 'Referral', 'slug' => 'referrals', 'icon' => 'clipboard-list', 'parent_slug' => 'cases_group', 'sort_order' => 43],

            // Instrumen
            ['name' => 'AKPD', 'slug' => 'instrument_akpd', 'icon' => 'file-question', 'parent_slug' => 'instruments', 'sort_order' => 50],
            ['name' => 'DCM', 'slug' => 'instrument_dcm', 'icon' => 'file-question', 'parent_slug' => 'instruments', 'sort_order' => 51],
            ['name' => 'Sosiometri', 'slug' => 'instrument_sociometry', 'icon' => 'network', 'parent_slug' => 'instruments', 'sort_order' => 52],
            ['name' => 'Minat Bakat', 'slug' => 'instrument_career', 'icon' => 'compass', 'parent_slug' => 'instruments', 'sort_order' => 53],

            // Program BK
            ['name' => 'RPL BK', 'slug' => 'program_rpl', 'icon' => 'file-text', 'parent_slug' => 'programs', 'sort_order' => 60],
            ['name' => 'Program Tahunan', 'slug' => 'program_annual', 'icon' => 'calendar-days', 'parent_slug' => 'programs', 'sort_order' => 61],
            ['name' => 'Program Semesteran', 'slug' => 'program_semester', 'icon' => 'calendar-days', 'parent_slug' => 'programs', 'sort_order' => 62],

            // Laporan & Sistem
            ['name' => 'Laporan', 'slug' => 'reports', 'icon' => 'bar-chart-3', 'parent_slug' => null, 'sort_order' => 70],
            ['name' => 'Sistem', 'slug' => 'system', 'icon' => 'settings', 'parent_slug' => null, 'sort_order' => 90],
        ];

        foreach ($modules as $m) {
            Module::updateOrCreate(['slug' => $m['slug']], $m);
        }
    }
}
