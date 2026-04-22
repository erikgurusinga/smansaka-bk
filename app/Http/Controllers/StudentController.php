<?php

namespace App\Http\Controllers;

use App\Imports\StudentsImport;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
}
