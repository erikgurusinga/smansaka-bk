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

class GroupCounselingController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = CounselingSession::query()
            ->where('type', 'group')
            ->with(['students', 'counselor', 'academicYear'])
            ->withCount('participants')
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where('topic', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sessions = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Counseling/Group/Index', [
            'sessions' => $sessions,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Counseling/Group/Create', [
            'students' => Student::where('status', 'aktif')->orderBy('name')->get(['id', 'nis', 'name', 'class_id']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_ids' => 'required|array|min:2',
            'student_ids.*' => 'exists:students,id',
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

        $studentIds = $data['student_ids'];
        unset($data['student_ids']);

        $data['type'] = 'group';
        $data['counselor_id'] = Auth::id();

        $session = CounselingSession::create($data);

        foreach ($studentIds as $studentId) {
            CounselingParticipant::create([
                'counseling_session_id' => $session->id,
                'student_id' => $studentId,
            ]);
        }

        return redirect()->route('counseling.group.index')
            ->with('success', 'Sesi konseling kelompok dicatat.');
    }

    public function show(CounselingSession $counselingSession): Response
    {
        $counselingSession->load(['students.schoolClass', 'counselor', 'academicYear']);

        return Inertia::render('Counseling/Group/Show', [
            'session' => $counselingSession,
        ]);
    }

    public function edit(CounselingSession $counselingSession): Response
    {
        $counselingSession->load(['students', 'academicYear']);

        return Inertia::render('Counseling/Group/Edit', [
            'session' => $counselingSession,
            'students' => Student::where('status', 'aktif')->orderBy('name')->get(['id', 'nis', 'name', 'class_id']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
        ]);
    }

    public function update(Request $request, CounselingSession $counselingSession): RedirectResponse
    {
        $data = $request->validate([
            'student_ids' => 'required|array|min:2',
            'student_ids.*' => 'exists:students,id',
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

        $studentIds = $data['student_ids'];
        unset($data['student_ids']);

        $counselingSession->update($data);

        // Sync participants
        $counselingSession->participants()->delete();
        foreach ($studentIds as $studentId) {
            CounselingParticipant::create([
                'counseling_session_id' => $counselingSession->id,
                'student_id' => $studentId,
            ]);
        }

        return back()->with('success', 'Sesi konseling kelompok diperbarui.');
    }

    public function destroy(CounselingSession $counselingSession): RedirectResponse
    {
        $counselingSession->delete();

        return redirect()->route('counseling.group.index')
            ->with('success', 'Sesi konseling kelompok dihapus.');
    }
}
