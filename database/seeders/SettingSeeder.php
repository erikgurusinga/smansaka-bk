<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'site_name', 'value' => 'Sistem Informasi Bimbingan & Konseling SMANSAKA', 'group' => 'branding', 'type' => 'string', 'label' => 'Nama Aplikasi'],
            ['key' => 'site_short_name', 'value' => 'BK SMANSAKA', 'group' => 'branding', 'type' => 'string', 'label' => 'Nama Singkat'],
            ['key' => 'school_name', 'value' => 'SMA Negeri 1 Kabanjahe', 'group' => 'general', 'type' => 'string', 'label' => 'Nama Sekolah'],
            ['key' => 'school_address', 'value' => 'Jl. Kapten Pala Bangun No. 1, Kabanjahe', 'group' => 'general', 'type' => 'string', 'label' => 'Alamat Sekolah'],
            ['key' => 'logo', 'value' => null, 'group' => 'branding', 'type' => 'file', 'label' => 'Logo Sekolah'],
            ['key' => 'favicon', 'value' => null, 'group' => 'branding', 'type' => 'file', 'label' => 'Favicon'],
        ];

        foreach ($settings as $s) {
            Setting::updateOrCreate(['key' => $s['key']], $s);
        }
    }
}
