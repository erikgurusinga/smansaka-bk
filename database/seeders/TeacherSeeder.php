<?php

namespace Database\Seeders;

use App\Models\Teacher;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            // Guru BK — terhubung ke akun user
            ['nip' => '197801012005011001', 'name' => 'Drs. Anto Sinulingga, M.Pd.', 'phone' => '081360001001', 'email' => 'anto.sinulingga@sman1kabanjahe.sch.id', 'is_bk' => true,  'user_id' => 3],
            ['nip' => '198203152008012002', 'name' => 'Sry Wulandari Br Tarigan, S.Pd.', 'phone' => '081360001002', 'email' => 'sry.tarigan@sman1kabanjahe.sch.id',    'is_bk' => true,  'user_id' => 4],
            ['nip' => '198507202010011003', 'name' => 'Roni Ginting, S.Pd., M.Si.',    'phone' => '081360001003', 'email' => 'roni.ginting@sman1kabanjahe.sch.id',      'is_bk' => true,  'user_id' => 5],

            // Guru mata pelajaran (wali kelas)
            ['nip' => '197605102003012004', 'name' => 'Henny Br Purba, S.Pd.',         'phone' => '081361001004', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '197902182004011005', 'name' => 'Maruli Karo-Karo, S.Pd.',        'phone' => '081361001005', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '198110052006012006', 'name' => 'Dewi Sembiring, S.Pd.',          'phone' => '081361001006', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '198306142007011007', 'name' => 'Budi Sitepu, S.T., M.Pd.',       'phone' => '081361001007', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '198501202008012008', 'name' => 'Leli Br Ginting, S.Pd.',         'phone' => '081361001008', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '198710112009011009', 'name' => 'Paulus Tarigan, S.Pd.',          'phone' => '081361001009', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '198904302010012010', 'name' => 'Riana Br Perangin-Angin, S.Pd.','phone' => '081361001010', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '199002152011011011', 'name' => 'Yohan Sinuraya, S.Pd.',          'phone' => '081361001011', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '199103282012012012', 'name' => 'Monalisa Br Sembiring, S.Pd.',   'phone' => '081361001012', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '199205102013011013', 'name' => 'Edy Sitepu, S.Pd.',              'phone' => '081361001013', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '199308242014012014', 'name' => 'Frida Br Karo, S.Pd.',           'phone' => '081361001014', 'email' => null, 'is_bk' => false, 'user_id' => null],
            ['nip' => '199411052015011015', 'name' => 'Kevin Bangun, S.Pd.',             'phone' => '081361001015', 'email' => null, 'is_bk' => false, 'user_id' => null],
        ];

        foreach ($teachers as $data) {
            Teacher::create($data);
        }
    }
}
