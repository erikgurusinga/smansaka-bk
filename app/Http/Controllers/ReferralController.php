<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CaseRecord;
use App\Models\Referral;
use App\Models\Student;
use App\Services\PdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReferralController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = Referral::query()
            ->with(['student.schoolClass', 'caseRecord', 'counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->whereHas('student', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Referrals/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Referrals/Create', [
            'students' => Student::where('status', 'aktif')->orderBy('name')->get(['id', 'nis', 'name', 'class_id']),
            'cases' => CaseRecord::with('student')->orderByDesc('created_at')->get(['id', 'title', 'student_id']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'case_id' => 'nullable|exists:cases,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'referred_to' => 'required|string|max:255',
            'reason' => 'required|string',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:aktif,diterima,ditolak,selesai',
        ]);

        $data['counselor_id'] = Auth::id();

        $referral = Referral::create($data);

        return redirect()->route('referrals.show', $referral->id)
            ->with('success', 'Referral dicatat.');
    }

    public function show(Referral $referral): Response
    {
        $referral->load(['student.schoolClass', 'caseRecord', 'counselor', 'academicYear']);

        return Inertia::render('Referrals/Show', [
            'referral' => $referral,
        ]);
    }

    public function update(Request $request, Referral $referral): RedirectResponse
    {
        $data = $request->validate([
            'referred_to' => 'required|string|max:255',
            'reason' => 'required|string',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:aktif,diterima,ditolak,selesai',
        ]);

        $referral->update($data);

        return back()->with('success', 'Referral diperbarui.');
    }

    public function destroy(Referral $referral): RedirectResponse
    {
        $referral->delete();

        return redirect()->route('referrals.index')
            ->with('success', 'Referral dihapus.');
    }

    public function pdf(Referral $referral): SymfonyResponse
    {
        $referral->load(['student.schoolClass', 'caseRecord', 'counselor', 'academicYear']);

        return PdfService::inline('pdf.referral', ['referral' => $referral], 'surat-rujukan');
    }
}
