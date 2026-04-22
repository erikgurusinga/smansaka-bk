<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\SociometryChoice;
use App\Models\SociometrySession;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SociometryController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = SociometrySession::query()
            ->with(['schoolClass', 'academicYear', 'counselor'])
            ->withCount('choices')
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($classId = $request->input('class_id')) {
            $query->where('class_id', $classId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $records = $query->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Instruments/Sociometry/Index', [
            'records' => $records,
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'filters' => $request->only('class_id', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Instruments/Sociometry/Create', [
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'max_choices' => 'required|integer|min:1|max:5',
            'criteria' => 'required|array|min:1',
            'criteria.*.key' => 'required|string',
            'criteria.*.label' => 'required|string',
            'criteria.*.polarity' => 'required|in:positive,negative',
            'status' => 'required|in:draft,open,closed',
        ]);

        $data['counselor_id'] = Auth::id();

        $session = SociometrySession::create($data);

        return redirect()->route('sociometry.show', $session->id)
            ->with('success', 'Sesi sosiometri dibuat.');
    }

    public function show(SociometrySession $session): Response
    {
        $session->load(['schoolClass', 'academicYear', 'counselor']);

        $students = Student::where('class_id', $session->class_id)
            ->where('status', 'aktif')
            ->orderBy('name')
            ->get(['id', 'nis', 'name']);

        $choices = SociometryChoice::where('session_id', $session->id)->get();

        // Statistik per siswa per criterion
        $stats = [];
        foreach ($session->criteria as $crit) {
            $inbound = $choices->where('criterion_key', $crit['key'])->groupBy('to_student_id');
            foreach ($students as $s) {
                $received = $inbound->get($s->id, collect())->count();
                $stats[$crit['key']][$s->id] = $received;
            }
        }

        $answeredStudentIds = $choices->pluck('from_student_id')->unique()->values();

        return Inertia::render('Instruments/Sociometry/Show', [
            'session' => $session,
            'students' => $students,
            'choices' => $choices,
            'stats' => $stats,
            'answered_student_ids' => $answeredStudentIds,
        ]);
    }

    public function fill(SociometrySession $session, Student $student): Response
    {
        $session->load(['schoolClass', 'academicYear']);

        $classmates = Student::where('class_id', $session->class_id)
            ->where('status', 'aktif')
            ->where('id', '!=', $student->id)
            ->orderBy('name')
            ->get(['id', 'nis', 'name']);

        $existingChoices = SociometryChoice::where('session_id', $session->id)
            ->where('from_student_id', $student->id)
            ->get(['criterion_key', 'to_student_id', 'rank']);

        return Inertia::render('Instruments/Sociometry/Fill', [
            'session' => $session,
            'student' => $student->load('schoolClass'),
            'classmates' => $classmates,
            'existing_choices' => $existingChoices,
        ]);
    }

    public function submit(Request $request, SociometrySession $session, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'choices' => 'required|array',
            'choices.*.criterion_key' => 'required|string',
            'choices.*.to_student_id' => 'required|exists:students,id',
            'choices.*.rank' => 'required|integer|min:1',
        ]);

        $criteriaMap = collect($session->criteria)->keyBy('key');

        DB::transaction(function () use ($session, $student, $data, $criteriaMap) {
            SociometryChoice::where('session_id', $session->id)
                ->where('from_student_id', $student->id)
                ->delete();

            $rows = [];
            $now = now();
            foreach ($data['choices'] as $c) {
                $polarity = $criteriaMap->get($c['criterion_key'])['polarity'] ?? 'positive';
                $rows[] = [
                    'session_id' => $session->id,
                    'from_student_id' => $student->id,
                    'to_student_id' => $c['to_student_id'],
                    'criterion_key' => $c['criterion_key'],
                    'polarity' => $polarity,
                    'rank' => $c['rank'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (! empty($rows)) {
                SociometryChoice::insert($rows);
            }
        });

        return redirect()->route('sociometry.show', $session->id)
            ->with('success', 'Pilihan sosiometri tersimpan.');
    }

    public function destroy(SociometrySession $session): RedirectResponse
    {
        $session->delete();

        return redirect()->route('sociometry.index')
            ->with('success', 'Sesi sosiometri dihapus.');
    }
}
