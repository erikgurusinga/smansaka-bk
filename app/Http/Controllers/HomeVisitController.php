<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\HomeVisit;
use App\Models\Student;
use App\Services\PdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HomeVisitController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = HomeVisit::query()
            ->with(['student.schoolClass', 'counselor', 'academicYear'])
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

        return Inertia::render('Counseling/HomeVisit/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Counseling/HomeVisit/Create', [
            'students' => Student::where('status', 'aktif')->orderBy('name')->get(['id', 'nis', 'name', 'class_id']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'purpose' => 'required|string',
            'findings' => 'nullable|string',
            'action_plan' => 'nullable|string',
            'signature_student' => 'nullable|string',
            'signature_parent' => 'nullable|string',
            'signature_counselor' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
        ]);

        $data['counselor_id'] = Auth::id();

        $visit = HomeVisit::create($data);

        return redirect()->route('home-visits.show', $visit->id)
            ->with('success', 'Home visit dicatat.');
    }

    public function show(HomeVisit $homeVisit): Response
    {
        $homeVisit->makeVisible(['signature_student', 'signature_parent', 'signature_counselor']);
        $homeVisit->load(['student.schoolClass', 'counselor', 'academicYear']);

        return Inertia::render('Counseling/HomeVisit/Show', [
            'visit' => $homeVisit,
        ]);
    }

    public function update(Request $request, HomeVisit $homeVisit): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'purpose' => 'required|string',
            'findings' => 'nullable|string',
            'action_plan' => 'nullable|string',
            'signature_student' => 'nullable|string',
            'signature_parent' => 'nullable|string',
            'signature_counselor' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
        ]);

        $homeVisit->update($data);

        return back()->with('success', 'Home visit diperbarui.');
    }

    public function destroy(HomeVisit $homeVisit): RedirectResponse
    {
        $homeVisit->delete();

        return redirect()->route('home-visits.index')
            ->with('success', 'Home visit dihapus.');
    }

    public function pdf(HomeVisit $homeVisit): SymfonyResponse
    {
        $homeVisit->makeVisible(['signature_student', 'signature_parent', 'signature_counselor']);
        $homeVisit->load(['student.schoolClass', 'counselor', 'academicYear']);

        return PdfService::inline('pdf.home-visit', ['visit' => $homeVisit], 'berita-acara-home-visit');
    }
}
