<?php

namespace App\Http\Controllers;

use App\Exports\MonthlyReportExport;
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
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $now = Carbon::now();

        $type = $request->input('type', 'monthly');
        $year = (int) $request->input('year', $now->year);
        $month = (int) $request->input('month', $now->month);
        $semester = $request->input('semester', $now->month >= 7 ? 'ganjil' : 'genap');

        [$start, $end, $label] = $this->resolveRange($type, $year, $month, $semester);

        $summary = $this->collectSummary($start, $end);

        return Inertia::render('Reports/Index', [
            'summary' => $summary,
            'type' => $type,
            'year' => $year,
            'month' => $month,
            'semester' => $semester,
            'period_label' => $label,
            'active_year' => $activeYear,
        ]);
    }

    public function pdf(Request $request): SymfonyResponse
    {
        $type = $request->input('type', 'monthly');
        $year = (int) $request->input('year', Carbon::now()->year);
        $month = (int) $request->input('month', Carbon::now()->month);
        $semester = $request->input('semester', Carbon::now()->month >= 7 ? 'ganjil' : 'genap');

        [$start, $end, $label] = $this->resolveRange($type, $year, $month, $semester);

        $summary = $this->collectSummary($start, $end);
        $details = $this->collectDetails($start, $end);

        $filename = match ($type) {
            'semester' => 'laporan-semester-'.$semester.'-'.$year,
            'yearly' => 'laporan-tahunan-'.$year,
            default => 'laporan-bulanan-'.$start->format('Y-m'),
        };

        return PdfService::inline('pdf.report-period', [
            'summary' => $summary,
            'details' => $details,
            'start' => $start,
            'end' => $end,
            'period_label' => $label,
            'type' => $type,
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ], $filename);
    }

    public function excel(Request $request): BinaryFileResponse
    {
        $type = $request->input('type', 'monthly');
        $year = (int) $request->input('year', Carbon::now()->year);
        $month = (int) $request->input('month', Carbon::now()->month);
        $semester = $request->input('semester', Carbon::now()->month >= 7 ? 'ganjil' : 'genap');

        [$start, $end, $label] = $this->resolveRange($type, $year, $month, $semester);

        $filename = match ($type) {
            'semester' => 'laporan-semester-'.$semester.'-'.$year.'.xlsx',
            'yearly' => 'laporan-tahunan-'.$year.'.xlsx',
            default => 'laporan-bulanan-'.$start->format('Y-m').'.xlsx',
        };

        $summary = $this->collectSummary($start, $end);
        $details = $this->collectDetails($start, $end);

        return Excel::download(
            new MonthlyReportExport($summary, $details, $start, $end, $label),
            $filename,
        );
    }

    /**
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    private function resolveRange(string $type, int $year, int $month, string $semester): array
    {
        if ($type === 'yearly') {
            $start = Carbon::create($year, 1, 1)->startOfDay();
            $end = Carbon::create($year, 12, 31)->endOfDay();
            $label = "Tahun $year";

            return [$start, $end, $label];
        }

        if ($type === 'semester') {
            if ($semester === 'ganjil') {
                $start = Carbon::create($year, 7, 1)->startOfDay();
                $end = Carbon::create($year, 12, 31)->endOfDay();
                $label = "Semester Ganjil TA $year/".($year + 1);
            } else {
                $start = Carbon::create($year, 1, 1)->startOfDay();
                $end = Carbon::create($year, 6, 30)->endOfDay();
                $label = 'Semester Genap TA '.($year - 1)."/$year";
            }

            return [$start, $end, $label];
        }

        // monthly
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $label = $start->translatedFormat('F Y');

        return [$start, $end, $label];
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
