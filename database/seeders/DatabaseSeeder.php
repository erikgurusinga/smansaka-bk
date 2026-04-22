<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ModuleSeeder::class,
            UserGroupSeeder::class,
            GroupAccessSeeder::class,
            UserSeeder::class,
            SettingSeeder::class,
            AcademicYearSeeder::class,
            ViolationSeeder::class,
            AkpdItemSeeder::class,
            DcmItemSeeder::class,
        ]);
    }
}
