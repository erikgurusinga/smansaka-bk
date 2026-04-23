<?php

namespace App\Http\Controllers;

use App\Imports\StudentsImport;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentGuidance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Student::query()->with('schoolClass');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($classId = $request->input('class_id')) {
            $query->where('class_id', $classId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($gender = $request->input('gender')) {
            $query->where('gender', $gender);
        }

        $students = $query
            ->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        // Tambah photo_url ke setiap siswa
        $students->through(function (Student $s) {
            $s->photo_url = $s->getFirstMediaUrl('photo');

            return $s;
        });

        return Inertia::render('Students/Index', [
            'students' => $students,
            'classes' => SchoolClass::with('academicYear')
                ->whereHas('academicYear', fn ($q) => $q->where('is_active', true))
                ->orderBy('level')->orderBy('name')->get(['id', 'name', 'level', 'academic_year_id']),
            'filters' => $request->only('search', 'class_id', 'status', 'gender', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nis' => 'required|string|unique:students,nis',
            'nisn' => 'nullable|string|unique:students,nisn',
            'name' => 'required|string|max:150',
            'gender' => 'required|in:L,P',
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'religion' => 'nullable|string|max:50',
            'class_id' => 'nullable|exists:classes,id',
            'status' => 'required|in:aktif,lulus,keluar,pindah',
        ]);

        Student::create($data);

        return back()->with('success', 'Siswa berhasil ditambahkan.');
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'nis' => "required|string|unique:students,nis,{$student->id}",
            'nisn' => "nullable|string|unique:students,nisn,{$student->id}",
            'name' => 'required|string|max:150',
            'gender' => 'required|in:L,P',
            'birth_place' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'religion' => 'nullable|string|max:50',
            'class_id' => 'nullable|exists:classes,id',
            'status' => 'required|in:aktif,lulus,keluar,pindah',
        ]);

        $student->update($data);

        return back()->with('success', 'Data siswa diperbarui.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        $student->delete();

        return back()->with('success', 'Siswa berhasil dihapus.');
    }

    public function updatePhoto(Request $request, Student $student): RedirectResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $student->addMediaFromRequest('photo')
            ->toMediaCollection('photo');

        return back()->with('success', 'Foto siswa diperbarui.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            Excel::import(new StudentsImport, $request->file('file'));

            return back()->with('success', 'Import siswa berhasil.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Import gagal: '.$e->getMessage());
        }
    }

    public function listParents(Student $student): JsonResponse
    {
        $parents = $student->guardians->map(fn (Guardian $g) => [
            'id' => $g->id,
            'name' => $g->name,
            'relation' => $g->relation,
            'phone' => $g->phone,
            'photo_url' => $g->getFirstMediaUrl('photo'),
        ]);

        return response()->json($parents);
    }

    public function attachParent(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate(['parent_id' => 'required|exists:parents,id']);
        $student->guardians()->syncWithoutDetaching([$data['parent_id']]);

        return back()->with('success', 'Orang tua berhasil dihubungkan.');
    }

    public function createAndAttachParent(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'relation' => 'required|in:ayah,ibu,wali',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'occupation' => 'nullable|string|max:100',
            'address' => 'nullable|string',
        ]);
        $guardian = Guardian::create($data);
        $student->guardians()->attach($guardian->id);

        return back()->with('success', 'Orang tua baru berhasil ditambahkan dan dihubungkan.');
    }

    public function detachParent(Student $student, Guardian $parent): RedirectResponse
    {
        $student->guardians()->detach($parent->id);

        return back()->with('success', 'Hubungan orang tua berhasil dihapus.');
    }

    public function lookup(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $user = Auth::user();
        $slugs = $user->groupSlugs();
        $isGuruBk = in_array('guru-bk', $slugs)
            && ! $user->isSuperAdmin()
            && ! in_array('koordinator-bk', $slugs);

        $query = Student::query()
            ->with('schoolClass:id,name')
            ->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%{$q}%")
                    ->orWhere('nis', 'like', "%{$q}%");
            });

        if ($isGuruBk) {
            $assignedIds = StudentGuidance::where('user_id', $user->id)->pluck('student_id');
            $query->whereIn('id', $assignedIds);
        }

        if ($classId = $request->input('class_id')) {
            $query->where('class_id', $classId);
        }

        $results = $query
            ->orderBy('name')
            ->limit(15)
            ->get(['id', 'nis', 'name', 'gender', 'status', 'class_id'])
            ->map(fn (Student $s) => [
                'id' => $s->id,
                'nis' => $s->nis,
                'name' => $s->name,
                'gender' => $s->gender,
                'status' => $s->status,
                'class_name' => $s->schoolClass?->name,
                'photo_url' => $s->getFirstMediaUrl('photo'),
            ]);

        return response()->json($results);
    }

    public function profile(Student $student): JsonResponse
    {
        $student->load(['schoolClass:id,name', 'guardians']);

        return response()->json([
            'id' => $student->id,
            'nis' => $student->nis,
            'nisn' => $student->nisn,
            'name' => $student->name,
            'gender' => $student->gender,
            'birth_place' => $student->birth_place,
            'birth_date' => $student->birth_date?->format('Y-m-d'),
            'address' => $student->address,
            'phone' => $student->phone,
            'religion' => $student->religion,
            'status' => $student->status,
            'class_name' => $student->schoolClass?->name,
            'photo_url' => $student->getFirstMediaUrl('photo'),
            'guardians' => $student->guardians->map(fn (Guardian $g) => [
                'id' => $g->id,
                'name' => $g->name,
                'relation' => $g->relation,
                'phone' => $g->phone,
                'email' => $g->email,
                'occupation' => $g->occupation,
                'address' => $g->address,
                'photo_url' => $g->getFirstMediaUrl('photo'),
            ]),
        ]);
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        Student::whereIn('id', $ids)->each->delete();

        return back()->with('success', count($ids).' siswa berhasil dihapus.');
    }
}
