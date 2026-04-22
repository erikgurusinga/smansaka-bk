<?php

namespace Database\Seeders;

use App\Models\DcmItem;
use Illuminate\Database\Seeder;

class DcmItemSeeder extends Seeder
{
    public function run(): void
    {
        $topics = [
            1 => ['Kesehatan', [
                'Sering sakit ketika di SD', 'Sering sakit ketika di SMP', 'Jantung sering terasa berdebar',
                'Keringat dingin', 'Kesehatan saya sering terganggu', 'Pernah dioperasi',
                'Merasa terlalu gemuk', 'Merasa terlalu kurus', 'Selalu kurang nafsu makan',
                'Saya merasa kurang bahagia', 'Sering kurang/tidak dapat tidur', 'Merasa lelah dan tidak bersemangat',
                'Makanan saya kurang memenuhi gizi', 'Kurang makan sehingga sering lapar', 'Sering merasa ngantuk',
                'Penglihatan saya kurang jelas', 'Pendengaran saya kurang baik', 'Saya merasa sering pusing',
                'Saya sering kurang/tidak nafsu makan', 'Saya sering merasa mual',
            ]],
            2 => ['Keadaan Ekonomi', [
                'Uang saku saya kurang mencukupi', 'Kekurangan buku karena tidak mampu membeli',
                'Ayah sudah pensiun dan tidak bekerja', 'Ayah telah meninggal dan ibu tidak bekerja',
                'Orang tua tidak bekerja tetap', 'Saya terpaksa harus bekerja', 'Tidak tahu bagaimana cara mencari biaya sekolah',
                'Saya sering berhutang', 'Terlalu banyak saudara yang masih harus dibiayai',
                'Tidak dapat menabung karena penghasilan pas-pasan', 'Saya ingin mempunyai pekerjaan paruh waktu',
                'Uang sekolah saya sering menunggak', 'Ingin memiliki uang saku sendiri',
                'Penghasilan keluarga tidak menentu', 'Keluarga kesulitan memenuhi kebutuhan pokok',
                'Saya membayar uang kos dari usaha sendiri', 'Orang tua saya punya hutang pada tetangga',
                'Sering kekurangan uang untuk membayar tugas', 'Ekonomi keluarga terasa semakin sulit',
                'Belum bisa memisahkan kebutuhan dan keinginan',
            ]],
            3 => ['Kehidupan Keluarga', [
                'Ayah dan ibu sering bertengkar', 'Ayah atau ibu sudah meninggal',
                'Orang tua bercerai', 'Ayah/ibu menikah lagi', 'Di rumah saya merasa kurang tenang',
                'Keluarga kami kurang akrab', 'Saya kurang mendapatkan perhatian orang tua',
                'Orang tua terlalu keras kepada saya', 'Saya iri dengan saudara saya',
                'Orang tua saya suka marah-marah', 'Ayah/ibu saya galak dan pemarah',
                'Adik/kakak saya nakal dan mengganggu saya', 'Orang tua membeda-bedakan saya dengan saudara',
                'Orang tua tidak mengerti keinginan saya', 'Di rumah saya tidak memiliki kamar sendiri',
                'Tinggal bersama nenek/kakek/paman/bibi', 'Orang tua saya sibuk dan jarang di rumah',
                'Keluarga kurang harmonis', 'Saya malu mengenalkan keluarga kepada teman',
                'Orang tua saya terlalu protektif',
            ]],
            4 => ['Agama dan Moral', [
                'Saya jarang menjalankan ibadah wajib', 'Sering mengikuti kegiatan keagamaan',
                'Kurang memahami ajaran agama', 'Sering merasa ragu dalam beragama',
                'Bingung karena banyak aliran agama', 'Keluarga kurang taat beragama',
                'Ragu dengan kebenaran kitab suci', 'Sulit memahami isi kitab suci',
                'Pergaulan membuat saya jauh dari agama', 'Saya merasa berdosa karena sering bolos ibadah',
                'Saya sering berkata kasar', 'Saya pernah mengambil barang orang lain',
                'Saya pernah berbohong kepada orang tua', 'Saya pernah melanggar norma susila',
                'Saya merasa kehilangan arah hidup', 'Belum mempunyai tokoh agama yang dicontoh',
                'Kurang terbiasa beribadah bersama keluarga', 'Merasa kurang nyaman saat beribadah',
                'Saya sulit menemukan teman yang taat beragama', 'Saya ingin lebih mendalami agama',
            ]],
            5 => ['Rekreasi dan Hobi', [
                'Saya tidak memiliki waktu rekreasi', 'Tidak tahu cara memanfaatkan waktu luang',
                'Hobi saya mengganggu belajar', 'Tidak memiliki hobi yang tetap',
                'Jarang berolahraga', 'Tidak ada tempat untuk menyalurkan hobi',
                'Ingin mempunyai banyak teman untuk rekreasi', 'Senang bermain dengan teman sebaya',
                'Waktu rekreasi saya terganggu pekerjaan rumah', 'Hobi saya kurang didukung keluarga',
                'Saya malu mengenalkan hobi saya', 'Saya ingin belajar musik tapi tidak ada dana',
                'Saya ingin menulis tapi tidak tahu caranya', 'Saya bingung memilih hobi yang cocok',
                'Saya terlalu banyak bermain game online', 'Kegiatan sosial mengurangi waktu rekreasi',
                'Sulit menemukan teman dengan hobi yang sama', 'Olahraga saya kurang rutin',
                'Lingkungan rumah kurang mendukung rekreasi', 'Saya ingin ikut klub di sekolah',
            ]],
            6 => ['Hubungan Sosial', [
                'Saya sukar bergaul', 'Saya mudah tersinggung', 'Takut bergaul dengan orang yang lebih tua',
                'Takut bergaul dengan lawan jenis', 'Tidak mudah bersahabat',
                'Tidak suka bertamu', 'Tidak suka berkumpul dengan orang banyak',
                'Mudah diajak teman untuk hal-hal buruk', 'Merasa rendah diri di depan teman',
                'Saya merasa asing dalam kelompok', 'Saya tidak memiliki sahabat dekat',
                'Teman saya sedikit sekali', 'Saya sering dijauhi teman',
                'Saya ingin dikenal banyak orang', 'Saya sering dibohongi teman',
                'Saya mudah curiga kepada orang', 'Saya sering bertengkar dengan teman',
                'Saya merasa berbeda sendiri di kelas', 'Saya ingin lebih dihargai teman',
                'Saya sulit memulai percakapan',
            ]],
            7 => ['Kehidupan Sekolah', [
                'Saya tidak suka sekolah', 'Saya sering bolos sekolah',
                'Saya membolos karena pelajaran tertentu', 'Saya kurang senang dengan suasana sekolah',
                'Pelajaran terasa berat untuk saya', 'Saya sering datang terlambat',
                'Fasilitas sekolah kurang lengkap', 'Saya kurang cocok dengan teman sekelas',
                'Saya malas mengikuti upacara', 'Peraturan sekolah terlalu ketat',
                'Guru saya kurang menyenangkan', 'Saya sering ditegur guru',
                'Saya tidak punya teman dekat di sekolah', 'Buku pelajaran saya kurang lengkap',
                'Saya sulit beradaptasi dengan sekolah ini', 'Saya sulit memahami kurikulum sekolah',
                'Saya ingin pindah sekolah', 'Saya ingin kegiatan sekolah lebih variatif',
                'Kegiatan ekstrakurikuler mengganggu belajar', 'Saya ingin berprestasi di sekolah',
            ]],
            8 => ['Kebiasaan Belajar', [
                'Saya tidak bisa belajar di rumah', 'Saya belajar hanya jika ada ulangan',
                'Saya suka membaca buku cerita', 'Buku pelajaran saya kurang',
                'Sering tidak dapat menyelesaikan PR', 'Sulit memahami isi buku pelajaran',
                'Saya malas mencatat pelajaran', 'Saya malas membuat ringkasan',
                'Saya kesulitan belajar mandiri', 'Saya butuh teman belajar kelompok',
                'Waktu belajar saya tidak teratur', 'Saya belajar hanya saat akan ujian',
                'Saya sulit memahami pelajaran tertentu', 'Saya tidak tahu cara mengulang pelajaran',
                'Saya tidak pernah belajar di rumah', 'Saya sulit membagi waktu belajar',
                'Saya sulit fokus saat belajar', 'Saya kurang percaya diri saat ujian',
                'Nilai ulangan saya sering jelek', 'Saya ingin mendapat ranking bagus',
            ]],
            9 => ['Masa Depan/Cita-cita', [
                'Belum tahu akan melanjutkan ke mana', 'Cita-cita saya berubah-ubah',
                'Khawatir tidak diterima di PTN', 'Takut tidak mampu biaya kuliah',
                'Ingin kuliah tapi orang tua tidak setuju', 'Belum tahu cara masuk PTN',
                'Cita-cita tidak sesuai bakat saya', 'Belum memahami potensi diri',
                'Saya bingung memilih jurusan', 'Takut menghadapi masa depan',
                'Pilihan karier saya dipengaruhi teman', 'Orang tua memaksa cita-cita tertentu',
                'Saya takut lulus SMA tanpa ilmu cukup', 'Saya ingin cepat bekerja setelah SMA',
                'Tidak punya gambaran karier yang jelas', 'Saya ingin berwirausaha',
                'Saya khawatir persaingan kerja', 'Saya butuh info tentang dunia kerja',
                'Saya ingin kuliah di luar negeri', 'Cita-cita saya terlalu tinggi',
            ]],
            10 => ['Penyesuaian Terhadap Kurikulum', [
                'Pelajaran MIPA terasa sulit', 'Pelajaran IPS terasa sulit',
                'Pelajaran Bahasa terasa sulit', 'Pelajaran Agama terasa sulit',
                'Pelajaran Olahraga terasa berat', 'Saya merasa jam pelajaran terlalu panjang',
                'Kurikulum terlalu padat', 'Saya kurang senang metode guru mengajar',
                'Saya kesulitan mengikuti pelajaran praktik', 'Fasilitas laboratorium kurang memadai',
                'Saya sulit mengikuti diskusi di kelas', 'Tugas sekolah terlalu banyak',
                'Materi pelajaran sulit saya pahami', 'Saya sulit mengejar ketertinggalan',
                'Saya kurang suka sistem remedial', 'Saya sulit memahami bahasa asing',
                'Saya kesulitan dalam pelajaran hitung', 'Saya kesulitan dalam pelajaran hafalan',
                'Saya ingin kurikulum lebih praktis', 'Saya belum terbiasa dengan kurikulum baru',
            ]],
            11 => ['Muda-Mudi / Lawan Jenis', [
                'Saya merasa minder berhadapan dengan lawan jenis', 'Saya belum pernah pacaran',
                'Saya sedang pacaran dan mengganggu belajar', 'Saya takut ditolak lawan jenis',
                'Teman-teman memaksa saya pacaran', 'Saya cemburu melihat teman',
                'Saya merasa bingung menghadapi lawan jenis', 'Saya merasa canggung dengan lawan jenis',
                'Saya dilarang orang tua bergaul dengan lawan jenis', 'Saya sedang patah hati',
                'Saya diintimidasi oleh mantan pacar', 'Saya tidak tahu batas pergaulan',
                'Saya sering difitnah pacaran', 'Saya kurang percaya diri dengan lawan jenis',
                'Pacar saya mengekang saya', 'Saya ingin memiliki teman dekat lawan jenis',
                'Pacar saya tidak mengerti kondisi saya', 'Saya pernah berperilaku tidak pantas',
                'Saya bingung mendefinisikan cinta', 'Saya ingin hubungan yang sehat',
            ]],
            12 => ['Pribadi dan Psikologis', [
                'Saya mudah menangis', 'Saya mudah tersinggung',
                'Saya mudah marah', 'Saya sering merasa takut tanpa sebab',
                'Saya sering bermimpi buruk', 'Saya sering merasa sedih',
                'Saya merasa tidak berharga', 'Saya pernah ingin menyakiti diri sendiri',
                'Saya merasa hidup tidak adil', 'Saya sering merasa cemas',
                'Saya sering merasa gelisah', 'Saya sulit mengambil keputusan',
                'Saya sulit mempercayai orang lain', 'Saya pendendam',
                'Saya sering merasa bersalah', 'Saya merasa kurang diperhatikan',
                'Saya sering bicara sendiri', 'Saya terlalu perasa',
                'Saya merasa tidak dicintai', 'Saya ingin lebih tenang menghadapi masalah',
            ]],
        ];

        $globalOrder = 0;
        foreach ($topics as $topicOrder => [$topicName, $questions]) {
            foreach ($questions as $q) {
                DcmItem::updateOrCreate(
                    ['topic' => $topicName, 'question' => $q],
                    [
                        'topic_order' => $topicOrder,
                        'sort_order' => ++$globalOrder,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
