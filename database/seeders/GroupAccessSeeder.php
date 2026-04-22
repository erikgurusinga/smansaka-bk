<?php

namespace Database\Seeders;

use App\Models\GroupAccess;
use App\Models\Module;
use App\Models\UserGroup;
use Illuminate\Database\Seeder;

class GroupAccessSeeder extends Seeder
{
    public function run(): void
    {
        $modules = Module::all()->keyBy('slug');
        $groups = UserGroup::all()->keyBy('slug');

        // Super Admin: semua akses
        $this->grantAll($groups['super-admin']->id, $modules, read: true, write: true);

        // Koordinator BK: semua BK (bukan sistem)
        $koordModules = $modules->except('system');
        $this->grantAll($groups['koordinator-bk']->id, $koordModules, read: true, write: true);

        // Guru BK: modul BK (tanpa system, reports write)
        $guruBkSlugs = [
            'dashboard',
            'students', 'classes', 'parents',
            'counseling_individual', 'counseling_group', 'counseling_classical', 'home_visit',
            'cases', 'violations', 'case_conferences', 'referrals',
            'instrument_akpd', 'instrument_dcm', 'instrument_sociometry', 'instrument_career',
            'program_rpl',
        ];
        foreach ($guruBkSlugs as $slug) {
            if (isset($modules[$slug])) {
                $this->grant($groups['guru-bk']->id, $modules[$slug]->id, read: true, write: true);
            }
        }
        // Laporan: read only
        $this->grant($groups['guru-bk']->id, $modules['reports']->id, read: true, write: false);

        // Wali Kelas: lihat siswa & kasus publik
        foreach (['dashboard', 'students', 'classes', 'cases', 'violations'] as $slug) {
            if (isset($modules[$slug])) {
                $this->grant($groups['wali-kelas']->id, $modules[$slug]->id, read: true, write: false);
            }
        }

        // Kepala Sekolah: read-only semua
        foreach ($modules as $m) {
            if ($m->slug === 'system') continue;
            $this->grant($groups['kepala-sekolah']->id, $m->id, read: true, write: false);
        }
    }

    private function grantAll(int $groupId, $modules, bool $read, bool $write): void
    {
        foreach ($modules as $m) {
            $this->grant($groupId, $m->id, $read, $write);
        }
    }

    private function grant(int $groupId, int $moduleId, bool $read, bool $write): void
    {
        GroupAccess::updateOrCreate(
            ['group_id' => $groupId, 'module_id' => $moduleId],
            ['can_read' => $read, 'can_write' => $write],
        );
    }
}
