<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CounselingParticipant;
use App\Models\CounselingSession;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class IndividualCounselingController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = CounselingSession::query()
            ->where('type', 'individual')
            ->with(['students', 'counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('topic', 'like', "%{$search}%")
                    ->orWhereHas('students', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sessions = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Counseling/Individual/Index', [
            'sessions' => $sessions,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Counseling/Individual/Create', [
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
            'start_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:1|max:480',
            'topic' => 'required|string|max:255',
            'description' => 'nullable|string',
            'outcome' => 'nullable|string',
            'next_plan' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,berlangsung,selesai,dibatalkan',
            'is_confidential' => 'boolean',
        ]);

        $studentId = $data['student_id'];
        unset($data['student_id']);

        $data['type'] = 'individual';
        $data['counselor_id'] = Auth::id();

        $session = CounselingSession::create($data);
        CounselingParticipant::create([
            'counseling_session_id' => $session->id,
            'student_id' => $studentId,
        ]);

        return redirect()->route('counseling.individual.index')
            ->with('success', 'Sesi konseling dicatat.');
    }

    public function show(CounselingSession $counselingSession): Response
    {
        $counselingSession->load(['students.schoolClass', 'counselor', 'academicYear']);

        return Inertia::render('Counseling/Individual/Show', [
            'session' => $counselingSession,
        ]);
    }

    public function edit(CounselingSession $counselingSession): Response
    {
        $counselingSession->load(['students', 'academicYear']);

        return Inertia::render('Counseling/Individual/Edit', [
            'session' => $counselingSession,
            'students' => Student::where('status', 'aktif')->orderBy('name')->get(['id', 'nis', 'name', 'class_id']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
        ]);
    }

    public function update(Request $request, CounselingSession $counselingSession): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:1|max:480',
            'topic' => 'required|string|max:255',
            'description' => 'nullable|string',
            'outcome' => 'nullable|string',
            'next_plan' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,berlangsung,selesai,dibatalkan',
            'is_confidential' => 'boolean',
        ]);

        $counselingSession->update($data);

        return back()->with('success', 'Sesi konseling diperbarui.');
    }

    public function destroy(CounselingSession $counselingSession): RedirectResponse
    {
        $counselingSession->delete();

        return redirect()->route('counseling.individual.index')
            ->with('success', 'Sesi konseling dihapus.');
    }
}
