<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\RplBk;
use App\Services\PdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RplBkController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = RplBk::query()
            ->with(['counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        foreach (['bidang', 'service_type', 'semester', 'class_level'] as $key) {
            if ($v = $request->input($key)) {
                $query->where($key, $v);
            }
        }

        $records = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Programs/Rpl/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'filters' => $request->only(
                'search', 'bidang', 'service_type', 'semester',
                'class_level', 'academic_year_id', 'per_page',
            ),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['counselor_id'] = Auth::id();
        $data['academic_year_id'] = $data['academic_year_id']
            ?? AcademicYear::where('is_active', true)->firstOrFail()->id;

        RplBk::create($data);

        return back()->with('success', 'RPL BK ditambahkan.');
    }

    public function update(Request $request, RplBk $rpl): RedirectResponse
    {
        $rpl->update($this->validated($request));

        return back()->with('success', 'RPL BK diperbarui.');
    }

    public function destroy(RplBk $rpl): RedirectResponse
    {
        $rpl->delete();

        return back()->with('success', 'RPL BK dihapus.');
    }

    public function show(RplBk $rpl): Response
    {
        $rpl->load(['counselor', 'academicYear']);

        return Inertia::render('Programs/Rpl/Show', [
            'rpl' => $rpl,
        ]);
    }

    public function pdf(RplBk $rpl): SymfonyResponse
    {
        $rpl->load(['counselor', 'academicYear']);

        return PdfService::inline('pdf.rpl-bk', ['rpl' => $rpl], 'rpl-bk');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'bidang' => 'required|in:pribadi,sosial,belajar,karier',
            'service_type' => 'required|in:klasikal,kelompok,individual,konsultasi',
            'class_level' => 'required|in:X,XI,XII,semua',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'semester' => 'required|in:ganjil,genap',
            'objective' => 'required|string',
            'method' => 'nullable|string',
            'materials' => 'nullable|string',
            'activities' => 'nullable|string',
            'evaluation' => 'nullable|string',
            'academic_year_id' => 'nullable|exists:academic_years,id',
        ]);
    }
}
