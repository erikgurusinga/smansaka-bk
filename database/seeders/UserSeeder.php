<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $groups = UserGroup::pluck('id', 'slug');

        // Super Admin (id=1)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Super Administrator',
                'email' => 'admin@smansakabanjahe.sch.id',
                'password' => Hash::make('admin12345'),
                'position' => 'Administrator Sistem',
                'groups' => [$groups['super-admin']],
                'is_active' => true,
            ]
        );

        // Koordinator BK
        User::updateOrCreate(
            ['username' => 'koorbk'],
            [
                'name' => 'Koordinator BK',
                'email' => 'koorbk@smansakabanjahe.sch.id',
                'password' => Hash::make('koorbk12345'),
                'position' => 'Koordinator BK',
                'groups' => [$groups['koordinator-bk']],
                'is_active' => true,
            ]
        );

        // Guru BK (3 orang sesuai kondisi SMANSAKA)
        foreach ([1, 2, 3] as $i) {
            User::updateOrCreate(
                ['username' => "gurubk{$i}"],
                [
                    'name' => "Guru BK {$i}",
                    'email' => "gurubk{$i}@smansakabanjahe.sch.id",
                    'password' => Hash::make("gurubk{$i}"),
                    'position' => 'Guru BK',
                    'groups' => [$groups['guru-bk']],
                    'is_active' => true,
                ]
            );
        }

        // Kepala Sekolah
        User::updateOrCreate(
            ['username' => 'kepsek'],
            [
                'name' => 'Kepala Sekolah',
                'email' => 'kepsek@smansakabanjahe.sch.id',
                'password' => Hash::make('kepsek12345'),
                'position' => 'Kepala Sekolah',
                'groups' => [$groups['kepala-sekolah']],
                'is_active' => true,
            ]
        );
    }
}
