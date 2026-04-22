<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CaseRecord;
use App\Models\ClassicalGuidance;
use App\Models\CounselingSession;
use App\Models\HomeVisit;
use App\Models\Referral;
use App\Models\StudentViolation;
use App\Services\PdfService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $now = Carbon::now();

        // Default: bulan berjalan
        $month = (int) $request->input('month', $now->month);
        $year = (int) $request->input('year', $now->year);

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $summary = $this->collectSummary($start, $end);

        return Inertia::render('Reports/Index', [
            'summary' => $summary,
            'month' => $month,
            'year' => $year,
            'active_year' => $activeYear,
        ]);
    }

    public function monthlyPdf(Request $request): SymfonyResponse
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $summary = $this->collectSummary($start, $end);
        $details = $this->collectDetails($start, $end);

        return PdfService::inline('pdf.report-monthly', [
            'summary' => $summary,
            'details' => $details,
            'start' => $start,
            'end' => $end,
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ], 'laporan-bulanan-'.$start->format('Y-m'));
    }

    private function collectSummary(Carbon $start, Carbon $end): array
    {
        $byCategory = CaseRecord::whereBetween('created_at', [$start, $end])
            ->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        return [
            'cases_total' => CaseRecord::whereBetween('created_at', [$start, $end])->count(),
            'cases_resolved' => CaseRecord::where('status', 'selesai')
                ->whereBetween('resolved_at', [$start, $end])
                ->count(),
            'cases_by_category' => [
                'akademik' => (int) ($byCategory['akademik'] ?? 0),
                'pribadi' => (int) ($byCategory['pribadi'] ?? 0),
                'sosial' => (int) ($byCategory['sosial'] ?? 0),
                'karier' => (int) ($byCategory['karier'] ?? 0),
                'pelanggaran' => (int) ($byCategory['pelanggaran'] ?? 0),
            ],
            'violations_total' => StudentViolation::whereBetween('date', [$start, $end])->count(),
            'counseling_individual' => CounselingSession::where('type', 'individual')
                ->whereBetween('date', [$start, $end])->count(),
            'counseling_group' => CounselingSession::where('type', 'group')
                ->whereBetween('date', [$start, $end])->count(),
            'classical' => ClassicalGuidance::whereBetween('date', [$start, $end])->count(),
            'home_visits' => HomeVisit::whereBetween('date', [$start, $end])->count(),
            'referrals' => Referral::whereBetween('date', [$start, $end])->count(),
        ];
    }

    private function collectDetails(Carbon $start, Carbon $end): array
    {
        return [
            'cases' => CaseRecord::with(['student:id,name', 'schoolClass:id,name'])
                ->whereBetween('created_at', [$start, $end])
                ->orderBy('created_at')
                ->get(['id', 'student_id', 'class_id', 'title', 'category', 'status', 'created_at']),

            'counseling' => CounselingSession::with('counselor:id,name')
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get(['id', 'counselor_id', 'type', 'topic', 'date', 'status']),

            'classical' => ClassicalGuidance::with(['counselor:id,name', 'schoolClass:id,name'])
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get(['id', 'counselor_id', 'class_id', 'topic', 'date', 'duration_minutes']),

            'home_visits' => HomeVisit::with('student:id,name')
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get(['id', 'student_id', 'purpose', 'date', 'status']),

            'violations' => StudentViolation::with(['student:id,name', 'violation:id,name,points'])
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get(['id', 'student_id', 'violation_id', 'date', 'notes']),

            'referrals' => Referral::with('student:id,name')
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get(['id', 'student_id', 'referred_to', 'date', 'status']),
        ];
    }
}
