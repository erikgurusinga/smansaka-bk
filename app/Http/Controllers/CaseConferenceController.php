<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CaseConference;
use App\Models\CaseRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CaseConferenceController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = CaseConference::query()
            ->with(['caseRecord.student', 'counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where('topic', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('CaseConferences/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('CaseConferences/Create', [
            'cases' => CaseRecord::with('student')->orderByDesc('created_at')->get(['id', 'title', 'student_id']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'case_id' => 'nullable|exists:cases,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'topic' => 'required|string|max:255',
            'participants' => 'nullable|array',
            'participants.*.name' => 'required|string|max:100',
            'participants.*.role' => 'required|string|max:100',
            'notes' => 'nullable|string',
            'outcome' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
        ]);

        $data['counselor_id'] = Auth::id();

        $conference = CaseConference::create($data);

        return redirect()->route('case-conferences.show', $conference->id)
            ->with('success', 'Konferensi kasus dicatat.');
    }

    public function show(CaseConference $caseConference): Response
    {
        $caseConference->load(['caseRecord.student', 'counselor', 'academicYear']);

        return Inertia::render('CaseConferences/Show', [
            'conference' => $caseConference,
        ]);
    }

    public function update(Request $request, CaseConference $caseConference): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'topic' => 'required|string|max:255',
            'participants' => 'nullable|array',
            'participants.*.name' => 'required|string|max:100',
            'participants.*.role' => 'required|string|max:100',
            'notes' => 'nullable|string',
            'outcome' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
        ]);

        $caseConference->update($data);

        return back()->with('success', 'Konferensi kasus diperbarui.');
    }

    public function destroy(CaseConference $caseConference): RedirectResponse
    {
        $caseConference->delete();

        return redirect()->route('case-conferences.index')
            ->with('success', 'Konferensi kasus dihapus.');
    }
}
