<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\AkpdResponse;
use App\Models\CaseRecord;
use App\Models\ClassicalGuidance;
use App\Models\CounselingSession;
use App\Models\HomeVisit;
use App\Models\Referral;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentViolation;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $yearId = $activeYear?->id;

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfWeek = $now->copy()->startOfWeek();

        // Stats utama
        $stats = [
            'total_students' => Student::where('status', 'aktif')->count(),
            'active_cases' => CaseRecord::whereIn('status', ['baru', 'penanganan'])->count(),
            'counseling_this_week' => CounselingSession::where('date', '>=', $startOfWeek)->count(),
            'home_visits_this_month' => HomeVisit::where('date', '>=', $startOfMonth)->count(),
            'total_referrals_this_year' => $yearId
                ? Referral::where('academic_year_id', $yearId)->count()
                : 0,
            'classical_this_month' => ClassicalGuidance::where('date', '>=', $startOfMonth)->count(),
        ];

        // Tren kasus 6 bulan terakhir
        $caseTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $caseTrend[] = [
                'label' => $month->locale('id')->translatedFormat('M Y'),
                'kasus' => CaseRecord::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count(),
                'pelanggaran' => StudentViolation::whereYear('date', $month->year)
                    ->whereMonth('date', $month->month)
                    ->count(),
                'konseling' => CounselingSession::whereYear('date', $month->year)
                    ->whereMonth('date', $month->month)
                    ->count(),
            ];
        }

        // Top 5 kelas rawan (akumulasi poin pelanggaran TA aktif)
        $classRisk = SchoolClass::query()
            ->leftJoin('students', 'students.class_id', '=', 'classes.id')
            ->leftJoin('student_violations', function ($j) use ($yearId) {
                $j->on('student_violations.student_id', '=', 'students.id');
                if ($yearId) {
                    $j->where('student_violations.academic_year_id', $yearId);
                }
            })
            ->leftJoin('violations', 'violations.id', '=', 'student_violations.violation_id')
            ->selectRaw('classes.id, classes.name, COALESCE(SUM(violations.points), 0) as total_points, COUNT(student_violations.id) as total_incidents')
            ->groupBy('classes.id', 'classes.name')
            ->orderByDesc('total_points')
            ->limit(5)
            ->get();

        // Distribusi bidang AKPD dominan (tahun aktif)
        $akpdDistribution = [];
        if ($yearId) {
            $checkedCounts = AkpdResponse::query()
                ->where('academic_year_id', $yearId)
                ->where('checked', true)
                ->join('instrument_akpd_items', 'instrument_akpd_items.id', '=', 'instrument_akpd_responses.item_id')
                ->selectRaw('instrument_akpd_items.bidang, COUNT(*) as total')
                ->groupBy('instrument_akpd_items.bidang')
                ->pluck('total', 'bidang');

            foreach (['pribadi', 'sosial', 'belajar', 'karier'] as $b) {
                $akpdDistribution[] = [
                    'bidang' => ucfirst($b),
                    'count' => (int) ($checkedCounts[$b] ?? 0),
                ];
            }
        }

        // Case status distribution
        $caseStatus = CaseRecord::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => ['label' => ucfirst($r->status), 'value' => (int) $r->total]);

        // Aktivitas terbaru (recent 10)
        $recentCases = CaseRecord::with('student:id,name')
            ->latest()
            ->limit(5)
            ->get(['id', 'student_id', 'title', 'status', 'created_at']);

        $recentCounseling = CounselingSession::with('counselor:id,name')
            ->latest()
            ->limit(5)
            ->get(['id', 'counselor_id', 'type', 'topic', 'date', 'created_at']);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'case_trend' => $caseTrend,
            'class_risk' => $classRisk,
            'akpd_distribution' => $akpdDistribution,
            'case_status' => $caseStatus,
            'recent_cases' => $recentCases,
            'recent_counseling' => $recentCounseling,
            'active_year' => $activeYear,
        ]);
    }
}
