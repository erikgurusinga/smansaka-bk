<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
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
            ->with(['student.schoolClass', 'teacher.teacher', 'academicYear'])
            ->when($activeYear, fn ($q) => $q->where('student_guidance.academic_year_id', $activeYear->id))
            ->leftJoin('students as sg_s', 'student_guidance.student_id', '=', 'sg_s.id')
            ->leftJoin('classes as sg_c', 'sg_s.class_id', '=', 'sg_c.id')
            ->select('student_guidance.*')
            ->orderBy('sg_c.level')
            ->orderBy('sg_c.name')
            ->orderBy('sg_s.name');

        if ($teacherId = $request->input('teacher_id')) {
            $query->where('student_guidance.user_id', $teacherId);
        }

        if ($classId = $request->input('class_id')) {
            $query->where('sg_s.class_id', $classId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sg_s.name', 'like', "%{$search}%")
                    ->orWhere('sg_s.nis', 'like', "%{$search}%");
            });
        }

        $assignments = $query
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        $assignments->through(function (StudentGuidance $a) {
            $a->teacher_display_name = $a->teacher?->teacher?->name ?? $a->teacher?->name;

            return $a;
        });

        $bkTeachers = User::where('is_active', true)
            ->whereHas('teacher', fn ($q) => $q->where('is_bk', true))
            ->with('teacher:user_id,name')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->teacher?->name ?? $u->name,
            ]);

        $unassignedStudents = Student::where('status', 'aktif')
            ->whereDoesntHave('guidanceTeachers', fn ($q) => $q->where('academic_year_id', $activeYear?->id))
            ->with('schoolClass:id,name,level')
            ->orderBy('name')
            ->get(['id', 'nis', 'name', 'class_id']);

        $classes = SchoolClass::whereHas('academicYear', fn ($q) => $q->where('is_active', true))
            ->orderBy('level')
            ->orderBy('name')
            ->get(['id', 'name', 'level']);

        return Inertia::render('StudentGuidance/Index', [
            'assignments' => $assignments,
            'bk_teachers' => $bkTeachers,
            'unassigned_students' => $unassignedStudents,
            'active_year' => $activeYear,
            'classes' => $classes,
            'filters' => $request->only('teacher_id', 'class_id', 'search', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'user_id' => 'required|exists:users,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        foreach ($data['student_ids'] as $studentId) {
            StudentGuidance::firstOrCreate([
                'student_id' => $studentId,
                'user_id' => $data['user_id'],
                'academic_year_id' => $data['academic_year_id'],
            ]);
        }

        $count = count($data['student_ids']);

        return back()->with('success', $count === 1
            ? 'Siswa berhasil ditugaskan.'
            : "{$count} siswa berhasil ditugaskan.");
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

    public function destroyBulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_ids.*' => 'integer',
            'student_ids' => 'required|array|min:1',
            'academic_year_id' => 'required|integer',
        ]);
        StudentGuidance::whereIn('student_id', $data['student_ids'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->delete();

        return back()->with('success', count($data['student_ids']).' penugasan berhasil dihapus.');
    }
}
