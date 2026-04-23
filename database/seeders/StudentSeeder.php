<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $classes = SchoolClass::orderBy('id')->get();

        // 10 siswa per kelas — nama realistis bernuansa Karo / Sumatera Utara
        $names = [
            // Laki-laki
            ['Andi Pratama Sitepu', 'L'],
            ['Beni Kristian Tarigan', 'L'],
            ['Calvin Sinulingga', 'L'],
            ['David Ginting', 'L'],
            ['Edwin Karo-Karo', 'L'],
            ['Fajar Sembiring', 'L'],
            ['Gilbert Purba', 'L'],
            ['Hendra Bangun', 'L'],
            ['Irwan Sinuraya', 'L'],
            ['Johan Perangin-Angin', 'L'],
            ['Kevin Brahmana', 'L'],
            ['Luki Barus', 'L'],
            ['Mario Girsang', 'L'],
            ['Nando Manurung', 'L'],
            ['Oscar Situmorang', 'L'],
            ['Petrus Ginting', 'L'],
            ['Rafael Tarigan', 'L'],
            ['Samuel Surbakti', 'L'],
            ['Tommy Sembiring', 'L'],
            ['Ucok Sinaga', 'L'],
            ['Victor Br Karo', 'L'],
            ['William Barus', 'L'],
            ['Xander Ginting', 'L'],
            ['Yogi Tarigan', 'L'],
            ['Zaky Sembiring', 'L'],
            ['Arif Sitepu', 'L'],
            ['Bintang Ginting', 'L'],
            ['Candra Tarigan', 'L'],
            ['Deni Karo', 'L'],
            ['Evan Purba', 'L'],
            ['Fandi Sinulingga', 'L'],
            ['Galih Sembiring', 'L'],
            ['Haris Bangun', 'L'],
            ['Ivan Barus', 'L'],
            ['Jaka Sitepu', 'L'],
            ['Karim Tarigan', 'L'],
            ['Lanang Ginting', 'L'],
            ['Mahendra Surbakti', 'L'],
            ['Novan Sinuraya', 'L'],
            ['Obed Girsang', 'L'],
            ['Pandu Purba', 'L'],
            ['Riki Sembiring', 'L'],
            ['Sandi Tarigan', 'L'],
            ['Tomi Karo', 'L'],
            ['Udin Sitepu', 'L'],
            ['Vino Perangin-Angin', 'L'],
            ['Wahyu Ginting', 'L'],
            ['Xafier Brahmana', 'L'],
            ['Yansen Bangun', 'L'],
            ['Zidan Barus', 'L'],
            ['Agus Sinaga', 'L'],
            ['Bagas Sembiring', 'L'],
            ['Chandra Tarigan', 'L'],
            ['Dion Ginting', 'L'],
            ['Erik Sitepu', 'L'],
            ['Felix Purba', 'L'],
            ['Gilang Sinulingga', 'L'],
            ['Hendra Karo', 'L'],
            ['Irfan Surbakti', 'L'],
            ['Jefri Tarigan', 'L'],
            // Perempuan
            ['Adelina Br Tarigan', 'P'],
            ['Bertha Br Sembiring', 'P'],
            ['Clara Br Ginting', 'P'],
            ['Desi Br Sitepu', 'P'],
            ['Eva Br Purba', 'P'],
            ['Fina Br Sinulingga', 'P'],
            ['Grace Br Barus', 'P'],
            ['Hilda Br Bangun', 'P'],
            ['Irene Br Karo', 'P'],
            ['Juli Br Sinuraya', 'P'],
            ['Kristin Br Sembiring', 'P'],
            ['Lina Br Ginting', 'P'],
            ['Maria Br Tarigan', 'P'],
            ['Nina Br Sitepu', 'P'],
            ['Olga Br Purba', 'P'],
            ['Putri Br Perangin-Angin', 'P'],
            ['Rina Br Surbakti', 'P'],
            ['Sari Br Sembiring', 'P'],
            ['Tika Br Ginting', 'P'],
            ['Uli Br Tarigan', 'P'],
            ['Vika Br Sinulingga', 'P'],
            ['Winda Br Barus', 'P'],
            ['Xena Br Girsang', 'P'],
            ['Yeni Br Purba', 'P'],
            ['Zara Br Sitepu', 'P'],
            ['Aliya Br Karo', 'P'],
            ['Bella Br Bangun', 'P'],
            ['Citra Br Sinuraya', 'P'],
            ['Diana Br Sembiring', 'P'],
            ['Elsa Br Ginting', 'P'],
            ['Febri Br Tarigan', 'P'],
            ['Gita Br Surbakti', 'P'],
            ['Hani Br Sitepu', 'P'],
            ['Intan Br Barus', 'P'],
            ['Jesika Br Purba', 'P'],
            ['Kiki Br Sembiring', 'P'],
            ['Lisa Br Tarigan', 'P'],
            ['Mira Br Sinulingga', 'P'],
            ['Nita Br Karo', 'P'],
            ['Okta Br Perangin-Angin', 'P'],
            ['Peni Br Ginting', 'P'],
            ['Resti Br Sitepu', 'P'],
            ['Selvi Br Sembiring', 'P'],
            ['Tiara Br Bangun', 'P'],
            ['Ulfa Br Barus', 'P'],
            ['Vera Br Purba', 'P'],
            ['Widya Br Sinuraya', 'P'],
            ['Yola Br Tarigan', 'P'],
            ['Zulfah Br Sembiring', 'P'],
            ['Amelia Br Ginting', 'P'],
            ['Bunga Br Sitepu', 'P'],
            ['Chika Br Barus', 'P'],
            ['Dinda Br Purba', 'P'],
            ['Erika Br Tarigan', 'P'],
            ['Fitri Br Sinulingga', 'P'],
            ['Girya Br Karo', 'P'],
            ['Hesti Br Surbakti', 'P'],
            ['Icha Br Perangin-Angin', 'P'],
            ['Jihan Br Ginting', 'P'],
        ];

        $religions = ['Kristen', 'Kristen', 'Kristen', 'Katolik', 'Islam', 'Kristen'];
        $birthPlaces = ['Kabanjahe', 'Berastagi', 'Tigabinanga', 'Kutabuluh', 'Juhar', 'Merek', 'Tiga Panah', 'Barusjahe'];
        $addresses = [
            'Jl. Veteran No. ' ,
            'Jl. Letda Sujono No. ',
            'Jl. Merdeka No. ',
            'Jl. Pahlawan No. ',
            'Jl. Jamin Ginting No. ',
            'Jl. Kapten Bangsi Sembiring No. ',
        ];

        $nisCounter  = 26001; // NIS mulai dari 26001
        $nisnCounter = 3060000001; // NISN 10 digit
        $nameIndex   = 0;

        foreach ($classes as $class) {
            // Tentukan angkatan dari level
            $angkatan = match ($class->level) {
                'X'   => '26',
                'XI'  => '25',
                'XII' => '24',
            };

            for ($i = 1; $i <= 10; $i++) {
                [$name, $gender] = $names[$nameIndex % count($names)];
                $nameIndex++;

                $yearBorn = match ($class->level) {
                    'X'   => 2008,
                    'XI'  => 2007,
                    'XII' => 2006,
                };

                Student::create([
                    'nis'         => $angkatan . str_pad($nisCounter, 4, '0', STR_PAD_LEFT),
                    'nisn'        => (string) ($nisnCounter++),
                    'name'        => $name,
                    'gender'      => $gender,
                    'birth_place' => $birthPlaces[array_rand($birthPlaces)],
                    'birth_date'  => $yearBorn . '-' . str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT),
                    'address'     => $addresses[array_rand($addresses)] . rand(1, 99) . ', Kabanjahe',
                    'phone'       => null,
                    'religion'    => $religions[array_rand($religions)],
                    'class_id'    => $class->id,
                    'status'      => 'aktif',
                ]);

                $nisCounter++;
            }
        }
    }
}
