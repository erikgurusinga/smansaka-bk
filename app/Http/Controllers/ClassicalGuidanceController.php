<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ClassicalGuidance;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ClassicalGuidanceController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = ClassicalGuidance::query()
            ->with(['counselor', 'schoolClass', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where('topic', 'like', "%{$search}%");
        }

        if ($classId = $request->input('class_id')) {
            $query->where('class_id', $classId);
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Counseling/Classical/Index', [
            'records' => $records,
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name', 'level']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'class_id', 'academic_year_id', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'topic' => 'required|string|max:255',
            'description' => 'nullable|string',
            'method' => 'nullable|string|max:100',
            'evaluation' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:1|max:480',
        ]);

        $data['counselor_id'] = Auth::id();

        ClassicalGuidance::create($data);

        return back()->with('success', 'Bimbingan klasikal dicatat.');
    }

    public function update(Request $request, ClassicalGuidance $classicalGuidance): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'topic' => 'required|string|max:255',
            'description' => 'nullable|string',
            'method' => 'nullable|string|max:100',
            'evaluation' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:1|max:480',
        ]);

        $classicalGuidance->update($data);

        return back()->with('success', 'Bimbingan klasikal diperbarui.');
    }

    public function destroy(ClassicalGuidance $classicalGuidance): RedirectResponse
    {
        $classicalGuidance->delete();

        return back()->with('success', 'Catatan bimbingan klasikal dihapus.');
    }
}
