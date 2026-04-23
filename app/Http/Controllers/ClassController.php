<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SchoolClass::query()
            ->with(['academicYear', 'homeroomTeacher'])
            ->withCount('students');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($level = $request->input('level')) {
            $query->where('level', $level);
        }

        if ($ayId = $request->input('academic_year_id')) {
            $query->where('academic_year_id', $ayId);
        }

        $classes = $query
            ->orderBy('level')
            ->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Classes/Index', [
            'classes' => $classes,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'homeroom_teachers' => User::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('search', 'level', 'academic_year_id', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'level' => 'required|in:X,XI,XII',
            'academic_year_id' => 'required|exists:academic_years,id',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        SchoolClass::create($data);

        return back()->with('success', 'Kelas berhasil ditambahkan.');
    }

    public function update(Request $request, SchoolClass $class): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'level' => 'required|in:X,XI,XII',
            'academic_year_id' => 'required|exists:academic_years,id',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        $class->update($data);

        return back()->with('success', 'Kelas berhasil diperbarui.');
    }

    public function destroy(SchoolClass $class): RedirectResponse
    {
        $class->delete();

        return back()->with('success', 'Kelas berhasil dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        SchoolClass::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' kelas berhasil dihapus.');
    }
}
