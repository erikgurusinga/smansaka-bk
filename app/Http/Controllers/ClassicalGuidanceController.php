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

    public function create(): Response
    {
        return Inertia::render('Counseling/Classical/Create', [
            'classes' => SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
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
            'documentation' => 'nullable|array|max:2',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $data['counselor_id'] = Auth::id();
        unset($data['documentation'], $data['agreement']);

        $record = ClassicalGuidance::create($data);

        foreach ($request->file('documentation', []) as $file) {
            $record->addMedia($file)->toMediaCollection('documentation');
        }

        if ($request->hasFile('agreement')) {
            $record->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('counseling.classical.show', $record)
            ->with('success', 'Bimbingan klasikal dicatat.');
    }

    private function mediaItems(ClassicalGuidance $record): array
    {
        return $record->getMedia('documentation')
            ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl(), 'name' => $m->file_name])
            ->values()
            ->toArray();
    }

    private function agreementItem(ClassicalGuidance $record): ?array
    {
        $media = $record->getFirstMedia('agreements');

        return $media ? ['id' => $media->id, 'url' => $media->getUrl(), 'name' => $media->file_name] : null;
    }

    public function show(ClassicalGuidance $classicalGuidance): Response
    {
        $classicalGuidance->load(['counselor', 'schoolClass', 'academicYear']);

        return Inertia::render('Counseling/Classical/Show', [
            'record' => $classicalGuidance,
            'documentation' => $this->mediaItems($classicalGuidance),
            'agreement' => $this->agreementItem($classicalGuidance),
        ]);
    }

    public function edit(ClassicalGuidance $classicalGuidance): Response
    {
        $classicalGuidance->load(['schoolClass', 'academicYear']);

        return Inertia::render('Counseling/Classical/Edit', [
            'record' => $classicalGuidance,
            'classes' => SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']),
            'documentation' => $this->mediaItems($classicalGuidance),
            'agreement' => $this->agreementItem($classicalGuidance),
        ]);
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
            'delete_media_ids' => 'nullable|array',
            'delete_media_ids.*' => 'integer',
            'documentation' => 'nullable|array',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'delete_agreement' => 'nullable|boolean',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $classicalGuidance->update(\Arr::except($data, ['delete_media_ids', 'documentation', 'delete_agreement', 'agreement']));

        foreach ($request->input('delete_media_ids', []) as $mediaId) {
            $classicalGuidance->media()->where('id', $mediaId)->first()?->delete();
        }

        $remaining = $classicalGuidance->getMedia('documentation')->count();
        foreach ($request->file('documentation', []) as $file) {
            if ($remaining >= 2) {
                break;
            }
            $classicalGuidance->addMedia($file)->toMediaCollection('documentation');
            $remaining++;
        }

        if ($request->boolean('delete_agreement')) {
            $classicalGuidance->getFirstMedia('agreements')?->delete();
        }

        if ($request->hasFile('agreement')) {
            $classicalGuidance->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('counseling.classical.show', $classicalGuidance)
            ->with('success', 'Bimbingan klasikal diperbarui.');
    }

    public function destroy(ClassicalGuidance $classicalGuidance): RedirectResponse
    {
        $classicalGuidance->delete();

        return redirect()->route('counseling.classical.index')
            ->with('success', 'Catatan bimbingan klasikal dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        ClassicalGuidance::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' bimbingan klasikal berhasil dihapus.');
    }
}
