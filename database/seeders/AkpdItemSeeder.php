<?php

namespace Database\Seeders;

use App\Models\AkpdItem;
use Illuminate\Database\Seeder;

class AkpdItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Bidang Pribadi
            ['pribadi', 'Saya merasa kurang percaya diri dengan penampilan saya'],
            ['pribadi', 'Saya sering merasa cemas tanpa alasan yang jelas'],
            ['pribadi', 'Saya sulit menerima kekurangan diri sendiri'],
            ['pribadi', 'Saya sering merasa kesepian meski bersama orang lain'],
            ['pribadi', 'Saya belum mengenali minat dan bakat pribadi'],
            ['pribadi', 'Saya mudah tersinggung dan marah'],
            ['pribadi', 'Saya merasa hidup kurang bermakna'],
            ['pribadi', 'Saya kesulitan mengendalikan emosi'],
            ['pribadi', 'Saya kurang memahami nilai-nilai agama dalam kehidupan'],
            ['pribadi', 'Saya sering merasa minder dibandingkan teman'],
            ['pribadi', 'Saya merasa takut menghadapi masa depan'],
            ['pribadi', 'Saya sulit bangun pagi dan mengatur waktu tidur'],
            ['pribadi', 'Saya belum bisa menjaga kesehatan fisik dengan baik'],

            // Bidang Sosial
            ['sosial', 'Saya sulit menjalin pertemanan dengan lawan jenis'],
            ['sosial', 'Saya takut berbicara di depan orang banyak'],
            ['sosial', 'Saya merasa kurang diterima dalam kelompok teman'],
            ['sosial', 'Saya sering bertengkar dengan saudara kandung'],
            ['sosial', 'Hubungan saya dengan orang tua kurang harmonis'],
            ['sosial', 'Saya kesulitan menyampaikan pendapat di kelas'],
            ['sosial', 'Saya mudah terpengaruh ajakan teman yang negatif'],
            ['sosial', 'Saya belum mengerti etika pergaulan yang baik'],
            ['sosial', 'Saya malu berkenalan dengan orang baru'],
            ['sosial', 'Saya pernah menjadi korban perundungan (bullying)'],
            ['sosial', 'Saya merasa canggung saat bekerja kelompok'],
            ['sosial', 'Saya sulit memaafkan kesalahan orang lain'],

            // Bidang Belajar
            ['belajar', 'Saya sulit berkonsentrasi saat belajar'],
            ['belajar', 'Saya malas membaca buku pelajaran'],
            ['belajar', 'Saya belum punya cara belajar yang efektif'],
            ['belajar', 'Nilai saya menurun pada beberapa mata pelajaran'],
            ['belajar', 'Saya kesulitan memahami pelajaran Matematika'],
            ['belajar', 'Saya sering menunda mengerjakan tugas sekolah'],
            ['belajar', 'Saya mudah bosan saat di kelas'],
            ['belajar', 'Saya tidak tahu cara mengatur jadwal belajar'],
            ['belajar', 'Saya tidak punya tempat belajar yang nyaman di rumah'],
            ['belajar', 'Saya sering mengantuk di kelas'],
            ['belajar', 'Saya kesulitan mencatat materi pelajaran'],
            ['belajar', 'Saya tidak memiliki motivasi untuk berprestasi'],
            ['belajar', 'Saya tidak paham cara menghadapi ujian'],

            // Bidang Karier
            ['karier', 'Saya belum tahu jurusan/kuliah yang sesuai minat saya'],
            ['karier', 'Saya bingung menentukan cita-cita'],
            ['karier', 'Saya belum memahami jenis-jenis profesi yang ada'],
            ['karier', 'Saya ragu kemampuan saya cukup untuk jurusan yang dituju'],
            ['karier', 'Orang tua memaksakan jurusan tertentu kepada saya'],
            ['karier', 'Saya tidak tahu jalur seleksi masuk PTN/PTS'],
            ['karier', 'Saya belum kenal kampus atau sekolah lanjutan'],
            ['karier', 'Saya khawatir tidak dapat biaya kuliah'],
            ['karier', 'Saya ingin tahu prospek kerja jurusan yang saya minati'],
            ['karier', 'Saya butuh informasi beasiswa pendidikan'],
            ['karier', 'Saya perlu pelatihan keterampilan untuk masa depan'],
            ['karier', 'Saya ingin tahu tentang dunia kerja setelah lulus SMA'],
        ];

        $order = 0;
        foreach ($items as [$bidang, $question]) {
            AkpdItem::updateOrCreate(
                ['bidang' => $bidang, 'question' => $question],
                ['sort_order' => ++$order, 'is_active' => true],
            );
        }
    }
}
