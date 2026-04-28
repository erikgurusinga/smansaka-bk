<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Branding
            ['key' => 'site_name',        'value' => 'Sistem Informasi Bimbingan & Konseling SMANSAKA', 'group' => 'branding', 'type' => 'string', 'label' => 'Nama Aplikasi'],
            ['key' => 'site_short_name',  'value' => 'BK SMANSAKA',                                     'group' => 'branding', 'type' => 'string', 'label' => 'Nama Singkat Aplikasi'],
            ['key' => 'footer_text',      'value' => '© SMA Negeri 1 Kabanjahe — Sistem BK',           'group' => 'branding', 'type' => 'string', 'label' => 'Teks Footer'],
            ['key' => 'logo',             'value' => null,                                               'group' => 'branding', 'type' => 'file',   'label' => 'Logo Sekolah'],
            ['key' => 'favicon',          'value' => null,                                               'group' => 'branding', 'type' => 'file',   'label' => 'Favicon'],
            // Identitas Sekolah
            ['key' => 'school_name',      'value' => 'SMA Negeri 1 Kabanjahe',                         'group' => 'school',   'type' => 'string', 'label' => 'Nama Sekolah'],
            ['key' => 'school_address',   'value' => 'Jl. Kapten Pala Bangun No. 1, Kabanjahe',        'group' => 'school',   'type' => 'string', 'label' => 'Alamat Sekolah'],
            ['key' => 'npsn',             'value' => '10212834',                                        'group' => 'school',   'type' => 'string', 'label' => 'NPSN'],
            ['key' => 'school_phone',     'value' => '(0628) 20174',                                   'group' => 'school',   'type' => 'string', 'label' => 'Telepon Sekolah'],
            ['key' => 'school_email',     'value' => 'sman1kabanjahe@gmail.com',                       'group' => 'school',   'type' => 'string', 'label' => 'Email Sekolah'],
            ['key' => 'school_website',   'value' => '',                                                'group' => 'school',   'type' => 'string', 'label' => 'Website Sekolah'],
            // Pejabat
            ['key' => 'principal_name',   'value' => '', 'group' => 'official', 'type' => 'string', 'label' => 'Nama Kepala Sekolah'],
            ['key' => 'principal_nip',    'value' => '', 'group' => 'official', 'type' => 'string', 'label' => 'NIP Kepala Sekolah'],
            ['key' => 'coordinator_name', 'value' => '', 'group' => 'official', 'type' => 'string', 'label' => 'Nama Koordinator BK'],
            ['key' => 'coordinator_nip',  'value' => '', 'group' => 'official', 'type' => 'string', 'label' => 'NIP Koordinator BK'],
        ];

        foreach ($settings as $s) {
            Setting::updateOrCreate(['key' => $s['key']], $s);
        }
    }
}
