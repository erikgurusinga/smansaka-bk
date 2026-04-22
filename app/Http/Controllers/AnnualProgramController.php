<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\AkpdItem;
use App\Models\AkpdResponse;
use App\Models\AnnualProgram;
use App\Models\RplBk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AnnualProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = AnnualProgram::with(['academicYear', 'counselor'])
            ->withCount('semesterPrograms')
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $records = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Programs/Annual/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'filters' => $request->only('status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $yearId = $request->input('academic_year_id', $activeYear?->id);

        // Saran otomatis dari AKPD: hitung item dicentang per bidang
        $akpdSuggestion = [];
        if ($yearId) {
            $counts = AkpdResponse::query()
                ->where('academic_year_id', $yearId)
                ->where('checked', true)
                ->join('instrument_akpd_items', 'instrument_akpd_items.id', '=', 'instrument_akpd_responses.item_id')
                ->selectRaw('instrument_akpd_items.bidang, COUNT(*) as total')
                ->groupBy('instrument_akpd_items.bidang')
                ->pluck('total', 'bidang');

            $totalItems = AkpdItem::where('is_active', true)->count();
            $totalChecked = $counts->sum();

            foreach (['pribadi', 'sosial', 'belajar', 'karier'] as $b) {
                $c = (int) ($counts[$b] ?? 0);
                $pct = $totalChecked > 0 ? round(($c / $totalChecked) * 100) : 0;
                $akpdSuggestion[] = [
                    'bidang' => $b,
                    'checked_count' => $c,
                    'percentage' => $pct,
                    'priority' => $pct >= 30 ? 5 : ($pct >= 20 ? 4 : ($pct >= 10 ? 3 : 2)),
                    'target_count' => $pct >= 30 ? 4 : ($pct >= 20 ? 3 : ($pct >= 10 ? 2 : 1)),
                ];
            }
        }

        $rpls = RplBk::when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->orderBy('bidang')
            ->orderBy('title')
            ->get(['id', 'title', 'bidang', 'semester', 'service_type']);

        return Inertia::render('Programs/Annual/Create', [
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year_id' => $yearId,
            'akpd_suggestion' => $akpdSuggestion,
            'rpls' => $rpls,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed',
            'generation_source' => 'required|in:manual,akpd,dcm',
            'items' => 'required|array|min:1',
            'items.*.bidang' => 'required|in:pribadi,sosial,belajar,karier',
            'items.*.priority' => 'required|integer|min:1|max:5',
            'items.*.focus' => 'required|string',
            'items.*.target_count' => 'required|integer|min:0',
            'items.*.rpl_ids' => 'nullable|array',
        ]);

        $data['counselor_id'] = Auth::id();

        $program = AnnualProgram::create($data);

        return redirect()->route('annual.show', $program->id)
            ->with('success', 'Program tahunan dibuat.');
    }

    public function show(AnnualProgram $annual): Response
    {
        $annual->load(['academicYear', 'counselor', 'semesterPrograms']);

        // Ambil detail RPL untuk setiap item
        $rplIds = collect($annual->items ?? [])
            ->pluck('rpl_ids')
            ->flatten()
            ->unique()
            ->filter()
            ->values();

        $rpls = RplBk::whereIn('id', $rplIds)->get(['id', 'title', 'bidang', 'semester', 'service_type']);

        return Inertia::render('Programs/Annual/Show', [
            'program' => $annual,
            'linked_rpls' => $rpls,
        ]);
    }

    public function edit(AnnualProgram $annual): Response
    {
        $annual->load('academicYear');

        $rpls = RplBk::where('academic_year_id', $annual->academic_year_id)
            ->orderBy('bidang')
            ->orderBy('title')
            ->get(['id', 'title', 'bidang', 'semester', 'service_type']);

        return Inertia::render('Programs/Annual/Edit', [
            'program' => $annual,
            'rpls' => $rpls,
        ]);
    }

    public function update(Request $request, AnnualProgram $annual): RedirectResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,active,completed',
            'items' => 'required|array|min:1',
            'items.*.bidang' => 'required|in:pribadi,sosial,belajar,karier',
            'items.*.priority' => 'required|integer|min:1|max:5',
            'items.*.focus' => 'required|string',
            'items.*.target_count' => 'required|integer|min:0',
            'items.*.rpl_ids' => 'nullable|array',
        ]);

        $annual->update($data);

        return redirect()->route('annual.show', $annual->id)
            ->with('success', 'Program tahunan diperbarui.');
    }

    public function destroy(AnnualProgram $annual): RedirectResponse
    {
        $annual->delete();

        return redirect()->route('annual.index')
            ->with('success', 'Program tahunan dihapus.');
    }
}
