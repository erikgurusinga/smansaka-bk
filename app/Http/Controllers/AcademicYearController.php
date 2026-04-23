<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AcademicYear::query();

        if ($search = $request->input('search')) {
            $query->where('year', 'like', "%{$search}%");
        }

        $academicYears = $query
            ->orderByDesc('year')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('AcademicYears/Index', [
            'academic_years' => $academicYears,
            'filters' => $request->only('search', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'year' => 'required|string|max:20|unique:academic_years,year',
            'semester' => 'required|in:ganjil,genap',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'notes' => 'nullable|string|max:500',
        ]);

        AcademicYear::create($data);

        return back()->with('success', 'Tahun ajaran berhasil ditambahkan.');
    }

    public function update(Request $request, AcademicYear $academicYear): RedirectResponse
    {
        $data = $request->validate([
            'year' => 'required|string|max:20|unique:academic_years,year,'.$academicYear->id,
            'semester' => 'required|in:ganjil,genap',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'notes' => 'nullable|string|max:500',
        ]);

        $academicYear->update($data);

        return back()->with('success', 'Tahun ajaran berhasil diperbarui.');
    }

    public function activate(AcademicYear $academicYear): RedirectResponse
    {
        AcademicYear::where('id', '!=', $academicYear->id)->update(['is_active' => false]);
        $academicYear->update(['is_active' => true]);

        return back()->with('success', "Tahun ajaran {$academicYear->year} diaktifkan.");
    }

    public function destroy(AcademicYear $academicYear): RedirectResponse
    {
        if ($academicYear->is_active) {
            return back()->with('error', 'Tahun ajaran aktif tidak dapat dihapus.');
        }

        $academicYear->delete();

        return back()->with('success', 'Tahun ajaran berhasil dihapus.');
    }
}
