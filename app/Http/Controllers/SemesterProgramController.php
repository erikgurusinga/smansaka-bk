<?php

namespace App\Http\Controllers;

use App\Models\AnnualProgram;
use App\Models\RplBk;
use App\Models\SemesterProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SemesterProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SemesterProgram::with(['annualProgram.academicYear']);

        if ($annualId = $request->input('annual_program_id')) {
            $query->where('annual_program_id', $annualId);
        }

        $records = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        $annuals = AnnualProgram::with('academicYear')
            ->orderByDesc('created_at')
            ->get(['id', 'title', 'academic_year_id']);

        return Inertia::render('Programs/Semester/Index', [
            'records' => $records,
            'annuals' => $annuals,
            'filters' => $request->only('annual_program_id', 'per_page'),
        ]);
    }

    public function create(Request $request): Response
    {
        $annualId = (int) $request->input('annual_program_id');

        $annual = AnnualProgram::with('academicYear')->findOrFail($annualId);

        $rpls = RplBk::where('academic_year_id', $annual->academic_year_id)
            ->orderBy('bidang')
            ->orderBy('title')
            ->get(['id', 'title', 'bidang', 'semester', 'service_type', 'class_level']);

        $suggestedSemester = $request->input('semester', 'ganjil');

        return Inertia::render('Programs/Semester/Create', [
            'annual' => $annual,
            'rpls' => $rpls,
            'suggested_semester' => $suggestedSemester,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'annual_program_id' => 'required|exists:annual_programs,id',
            'semester' => 'required|in:ganjil,genap',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'schedule' => 'required|array',
            'schedule.*.month' => 'required|integer|min:1|max:12',
            'schedule.*.week' => 'required|integer|min:1|max:5',
            'schedule.*.rpl_id' => 'required|exists:rpl_bk,id',
            'schedule.*.class_level' => 'required|in:X,XI,XII,semua',
            'schedule.*.notes' => 'nullable|string',
        ]);

        // Enforce unique (annual_program_id, semester)
        $exists = SemesterProgram::where('annual_program_id', $data['annual_program_id'])
            ->where('semester', $data['semester'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Program semester ini sudah ada untuk TA tersebut.');
        }

        $program = SemesterProgram::create($data);

        return redirect()->route('semester.show', $program->id)
            ->with('success', 'Program semester dibuat.');
    }

    public function show(SemesterProgram $semester): Response
    {
        $semester->load('annualProgram.academicYear');

        $rplIds = collect($semester->schedule ?? [])->pluck('rpl_id')->unique()->values();
        $rpls = RplBk::whereIn('id', $rplIds)
            ->get(['id', 'title', 'bidang', 'service_type', 'class_level', 'duration_minutes']);

        return Inertia::render('Programs/Semester/Show', [
            'program' => $semester,
            'rpls' => $rpls,
        ]);
    }

    public function destroy(SemesterProgram $semester): RedirectResponse
    {
        $annualId = $semester->annual_program_id;
        $semester->delete();

        return redirect()->route('annual.show', $annualId)
            ->with('success', 'Program semester dihapus.');
    }
}
