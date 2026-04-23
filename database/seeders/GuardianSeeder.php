<?php

namespace Database\Seeders;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Database\Seeder;

class GuardianSeeder extends Seeder
{
    public function run(): void
    {
        $occupations = [
            'Petani', 'Wiraswasta', 'PNS', 'TNI/Polri', 'Pedagang',
            'Guru', 'Buruh', 'Supir', 'Nelayan', 'Pegawai Swasta',
        ];

        $addresses = [
            'Jl. Veteran No. ',
            'Jl. Letda Sujono No. ',
            'Jl. Merdeka No. ',
            'Jl. Pahlawan No. ',
            'Jl. Jamin Ginting No. ',
            'Jl. Kapten Bangsi Sembiring No. ',
        ];

        Student::all()->each(function (Student $student) use ($occupations, $addresses) {
            // Ambil marga dari nama siswa (kata terakhir)
            $parts  = explode(' ', $student->name);
            $marga  = end($parts);

            // Tentukan nama orang tua berdasarkan jenis kelamin siswa
            if ($student->gender === 'L') {
                $ayahName = 'Jannes ' . $marga;
                $ibuName  = 'Rosita Br ' . $marga;
            } else {
                $ayahName = 'Polin ' . $marga;
                $ibuName  = 'Ernita Br ' . $marga;
            }

            $address = $addresses[array_rand($addresses)] . rand(1, 99) . ', Kabanjahe';

            // Buat data ayah
            $ayah = Guardian::create([
                'name'       => $ayahName,
                'relation'   => 'ayah',
                'phone'      => '08136' . str_pad(rand(1000000, 9999999), 7, '0', STR_PAD_LEFT),
                'email'      => null,
                'occupation' => $occupations[array_rand($occupations)],
                'address'    => $address,
            ]);
            $student->guardians()->attach($ayah->id);

            // 60% kemungkinan ada data ibu
            if (rand(1, 100) <= 60) {
                $ibu = Guardian::create([
                    'name'       => $ibuName,
                    'relation'   => 'ibu',
                    'phone'      => '08136' . str_pad(rand(1000000, 9999999), 7, '0', STR_PAD_LEFT),
                    'email'      => null,
                    'occupation' => $occupations[array_rand($occupations)],
                    'address'    => $address,
                ]);
                $student->guardians()->attach($ibu->id);
            }
        });
    }
}
