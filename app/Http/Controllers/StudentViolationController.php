<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\StudentViolation;
use App\Models\Violation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StudentViolationController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = StudentViolation::query()
            ->with(['student.schoolClass', 'violation', 'reporter', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->whereHas('student', fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('nis', 'like', "%{$search}%"));
        }

        if ($category = $request->input('category')) {
            $query->whereHas('violation', fn ($q) => $q->where('category', $category));
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($spLevel = $request->input('sp_level')) {
            $query->where('sp_level', $spLevel);
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        // Hitung akumulasi poin per siswa di TA aktif
        $pointSummary = [];
        if ($activeYear) {
            $pointSummary = StudentViolation::query()
                ->where('academic_year_id', $activeYear->id)
                ->join('violations', 'violations.id', '=', 'student_violations.violation_id')
                ->selectRaw('student_id, SUM(violations.points) as total_points, COUNT(*) as total_cases')
                ->groupBy('student_id')
                ->pluck('total_points', 'student_id')
                ->toArray();
        }

        return Inertia::render('StudentViolations/Index', [
            'records' => $records,
            'violations' => Violation::where('is_active', true)->orderBy('category')->orderBy('name')->get(['id', 'name', 'category', 'points']),
            'classes' => SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'point_summary' => $pointSummary,
            'filters' => $request->only('search', 'category', 'status', 'sp_level', 'academic_year_id', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'violation_id' => 'required|exists:violations,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'sp_level' => 'nullable|in:SP1,SP2,SP3',
        ]);

        $data['reported_by'] = Auth::id();
        $data['status'] = 'baru';

        StudentViolation::create($data);

        return back()->with('success', 'Pelanggaran berhasil dicatat.');
    }

    public function update(Request $request, StudentViolation $studentViolation): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'description' => 'nullable|string',
            'status' => 'required|in:baru,diproses,selesai',
            'sp_level' => 'nullable|in:SP1,SP2,SP3',
            'notes' => 'nullable|string',
        ]);

        $studentViolation->update($data);

        return back()->with('success', 'Data pelanggaran diperbarui.');
    }

    public function destroy(StudentViolation $studentViolation): RedirectResponse
    {
        $studentViolation->delete();

        return back()->with('success', 'Catatan pelanggaran dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        StudentViolation::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' catatan pelanggaran berhasil dihapus.');
    }
}
