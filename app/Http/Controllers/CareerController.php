<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CareerAssessment;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CareerController extends Controller
{
    /**
     * 48-item RIASEC inventory: 8 items per dimension × 6 dimensions.
     * Dimensions: R = Realistic, I = Investigative, A = Artistic,
     *             S = Social, E = Enterprising, C = Conventional
     */
    private function bank(): array
    {
        return [
            // Realistic
            ['R', 'Saya suka memperbaiki barang yang rusak'],
            ['R', 'Saya suka kegiatan di luar ruangan seperti berkebun atau olahraga alam'],
            ['R', 'Saya senang bekerja dengan mesin atau alat'],
            ['R', 'Saya tertarik dengan kendaraan dan teknologi mekanik'],
            ['R', 'Saya suka olahraga yang membutuhkan kekuatan fisik'],
            ['R', 'Saya tertarik dengan pertukangan kayu, listrik, atau otomotif'],
            ['R', 'Saya lebih suka pekerjaan praktis daripada teoritis'],
            ['R', 'Saya suka merakit atau membangun sesuatu dengan tangan'],

            // Investigative
            ['I', 'Saya senang memecahkan teka-teki atau masalah matematika'],
            ['I', 'Saya tertarik dengan eksperimen sains'],
            ['I', 'Saya suka membaca buku tentang sains dan teknologi'],
            ['I', 'Saya suka menganalisis data atau fakta'],
            ['I', 'Saya ingin mengetahui bagaimana sesuatu bekerja'],
            ['I', 'Saya senang meneliti topik yang membuat penasaran'],
            ['I', 'Saya suka bereksperimen untuk membuktikan sesuatu'],
            ['I', 'Saya tertarik dengan astronomi, biologi, atau fisika'],

            // Artistic
            ['A', 'Saya senang menggambar, melukis, atau mendesain'],
            ['A', 'Saya suka menulis cerita, puisi, atau artikel'],
            ['A', 'Saya tertarik bermain musik atau bernyanyi'],
            ['A', 'Saya suka fotografi atau videografi'],
            ['A', 'Saya menikmati pertunjukan seni atau teater'],
            ['A', 'Saya suka mengekspresikan ide melalui seni'],
            ['A', 'Saya senang membuat kerajinan tangan kreatif'],
            ['A', 'Saya ingin bekerja di bidang kreatif'],

            // Social
            ['S', 'Saya senang mengajar teman tentang sesuatu'],
            ['S', 'Saya suka menolong orang yang kesulitan'],
            ['S', 'Saya tertarik bekerja di bidang kesehatan atau sosial'],
            ['S', 'Saya nyaman berbicara di depan kelompok'],
            ['S', 'Saya sering menjadi pendengar yang baik bagi teman'],
            ['S', 'Saya suka menjadi sukarelawan/relawan'],
            ['S', 'Saya senang bekerja dalam tim'],
            ['S', 'Saya ingin pekerjaan yang berdampak bagi masyarakat'],

            // Enterprising
            ['E', 'Saya senang memimpin kegiatan atau kelompok'],
            ['E', 'Saya suka meyakinkan orang lain tentang ide saya'],
            ['E', 'Saya tertarik dengan bisnis dan kewirausahaan'],
            ['E', 'Saya berani mengambil risiko untuk peluang besar'],
            ['E', 'Saya suka bernegosiasi atau berjualan'],
            ['E', 'Saya senang merencanakan event atau proyek'],
            ['E', 'Saya ingin punya perusahaan sendiri'],
            ['E', 'Saya mudah memotivasi orang lain'],

            // Conventional
            ['C', 'Saya teliti dalam mengatur dokumen atau data'],
            ['C', 'Saya suka pekerjaan yang sistematis dan terstruktur'],
            ['C', 'Saya senang menyusun laporan atau catatan'],
            ['C', 'Saya disiplin dengan jadwal dan aturan'],
            ['C', 'Saya tertarik dengan akuntansi atau administrasi'],
            ['C', 'Saya suka bekerja dengan angka dan statistik'],
            ['C', 'Saya nyaman dengan rutinitas pekerjaan kantor'],
            ['C', 'Saya fokus pada detail dan akurasi'],
        ];
    }

    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $yearId = $request->input('academic_year_id', $activeYear?->id);

        $studentsQuery = Student::where('status', 'aktif')
            ->with(['schoolClass'])
            ->with([
                'careerAssessments' => fn ($q) => $q->where('academic_year_id', $yearId),
            ]);

        if ($classId = $request->input('class_id')) {
            $studentsQuery->where('class_id', $classId);
        }

        if ($search = $request->input('search')) {
            $studentsQuery->where('name', 'like', "%{$search}%");
        }

        $students = $studentsQuery->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Instruments/Career/Index', [
            'students' => $students,
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'filters' => $request->only('search', 'class_id', 'academic_year_id', 'per_page'),
        ]);
    }

    public function fill(Request $request, Student $student): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $yearId = $request->input('academic_year_id', $activeYear->id);

        $existing = CareerAssessment::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->latest()
            ->first();

        return Inertia::render('Instruments/Career/Fill', [
            'student' => $student->load('schoolClass'),
            'items' => collect($this->bank())->map(fn ($row, $idx) => [
                'id' => $idx + 1,
                'dimension' => $row[0],
                'question' => $row[1],
            ])->values(),
            'existing_scores' => $existing?->scores,
            'academic_year' => AcademicYear::find($yearId),
        ]);
    }

    public function submit(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'answers' => 'required|array',
            'answers.*' => 'integer|min:1|max:5',
            'notes' => 'nullable|string',
        ]);

        $bank = $this->bank();
        $scores = ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0];
        foreach ($data['answers'] as $id => $value) {
            $idx = (int) $id - 1;
            if (! isset($bank[$idx])) {
                continue;
            }
            $dim = $bank[$idx][0];
            $scores[$dim] += (int) $value;
        }

        arsort($scores);
        $dominantCodes = implode('', array_slice(array_keys($scores), 0, 3));

        $recommendations = $this->recommendationsFor($dominantCodes);

        CareerAssessment::updateOrCreate(
            ['student_id' => $student->id, 'academic_year_id' => $data['academic_year_id']],
            [
                'scores' => $scores,
                'dominant_codes' => $dominantCodes,
                'recommendations' => $recommendations,
                'notes' => $data['notes'] ?? null,
                'completed_at' => now(),
            ],
        );

        return redirect()->route('career.result', ['student' => $student->id, 'academic_year_id' => $data['academic_year_id']])
            ->with('success', 'Hasil asesmen karier tersimpan.');
    }

    public function result(Request $request, Student $student): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $yearId = $request->input('academic_year_id', $activeYear->id);

        $assessment = CareerAssessment::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->latest()
            ->first();

        return Inertia::render('Instruments/Career/Result', [
            'student' => $student->load('schoolClass'),
            'assessment' => $assessment,
            'dimension_labels' => [
                'R' => ['label' => 'Realistic', 'short' => 'Praktis', 'desc' => 'Menyukai kegiatan praktis, tangan, mesin, alam.'],
                'I' => ['label' => 'Investigative', 'short' => 'Peneliti', 'desc' => 'Menyukai analisis, sains, pemecahan masalah.'],
                'A' => ['label' => 'Artistic', 'short' => 'Artistik', 'desc' => 'Menyukai ekspresi kreatif, seni, desain.'],
                'S' => ['label' => 'Social', 'short' => 'Sosial', 'desc' => 'Menyukai interaksi, membantu, mengajar.'],
                'E' => ['label' => 'Enterprising', 'short' => 'Kewirausahaan', 'desc' => 'Menyukai kepemimpinan, bisnis, negosiasi.'],
                'C' => ['label' => 'Conventional', 'short' => 'Konvensional', 'desc' => 'Menyukai kerapian, struktur, data.'],
            ],
            'academic_year' => AcademicYear::find($yearId),
        ]);
    }

    private function recommendationsFor(string $code): string
    {
        $primary = $code[0] ?? 'R';
        $map = [
            'R' => 'Teknik Mesin, Teknik Sipil, Teknik Elektro, Pertanian, Otomotif, Kehutanan, Arsitektur Bangunan, Penerbangan/Pelayaran.',
            'I' => 'Kedokteran, Farmasi, Biologi, Fisika, Kimia, Matematika, Teknik Informatika, Ilmu Komputer, Statistika, Geologi.',
            'A' => 'Desain Komunikasi Visual, Seni Rupa, Musik, Sastra, Film & Televisi, Arsitektur, Fotografi, Animasi.',
            'S' => 'Bimbingan Konseling, Psikologi, Pendidikan Guru, Keperawatan, Pekerjaan Sosial, Komunikasi, Hubungan Masyarakat.',
            'E' => 'Manajemen, Bisnis Digital, Hukum, Hubungan Internasional, Administrasi Bisnis, Kewirausahaan, Pemasaran.',
            'C' => 'Akuntansi, Administrasi Perkantoran, Sistem Informasi, Perpajakan, Manajemen Keuangan, Statistika Terapan.',
        ];

        return 'Jurusan yang cocok dengan kombinasi '.$code.': '.($map[$primary] ?? '—');
    }
}
