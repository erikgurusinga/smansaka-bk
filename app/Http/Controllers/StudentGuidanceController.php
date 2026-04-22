<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\StudentGuidance;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentGuidanceController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = StudentGuidance::query()
            ->with(['student.schoolClass', 'teacher', 'academicYear'])
            ->when($activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($teacherId = $request->input('teacher_id')) {
            $query->where('user_id', $teacherId);
        }

        if ($search = $request->input('search')) {
            $query->whereHas('student', fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('nis', 'like', "%{$search}%"));
        }

        $assignments = $query
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        $bkTeachers = User::where('is_active', true)
            ->whereHas('teacher', fn ($q) => $q->where('is_bk', true))
            ->orderBy('name')
            ->get(['id', 'name']);

        $unassignedStudents = Student::where('status', 'aktif')
            ->whereDoesntHave('guidanceTeachers', fn ($q) => $q->where('academic_year_id', $activeYear?->id))
            ->orderBy('name')
            ->get(['id', 'nis', 'name', 'class_id']);

        return Inertia::render('StudentGuidance/Index', [
            'assignments' => $assignments,
            'bk_teachers' => $bkTeachers,
            'unassigned_students' => $unassignedStudents,
            'active_year' => $activeYear,
            'filters' => $request->only('teacher_id', 'search', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'user_id' => 'required|exists:users,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        StudentGuidance::firstOrCreate($data);

        return back()->with('success', 'Siswa berhasil ditugaskan.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'user_id' => 'required|exists:users,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        StudentGuidance::where([
            'student_id' => $request->student_id,
            'user_id' => $request->user_id,
            'academic_year_id' => $request->academic_year_id,
        ])->delete();

        return back()->with('success', 'Penugasan dihapus.');
    }
}
