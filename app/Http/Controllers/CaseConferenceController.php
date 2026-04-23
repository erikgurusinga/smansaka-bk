<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CaseConference;
use App\Models\CaseRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CaseConferenceController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = CaseConference::query()
            ->with(['caseRecord.student', 'counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where('topic', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('CaseConferences/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('CaseConferences/Create', [
            'cases' => CaseRecord::with('student')->orderByDesc('created_at')->get(['id', 'title', 'student_id']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'case_id' => 'nullable|exists:cases,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'topic' => 'required|string|max:255',
            'participants' => 'nullable|array',
            'participants.*.name' => 'required|string|max:100',
            'participants.*.role' => 'required|string|max:100',
            'notes' => 'nullable|string',
            'outcome' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
            'documentation' => 'nullable|array|max:2',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        unset($data['documentation'], $data['agreement']);
        $data['counselor_id'] = Auth::id();

        $conference = CaseConference::create($data);

        foreach ($request->file('documentation', []) as $file) {
            $conference->addMedia($file)->toMediaCollection('documentation');
        }

        if ($request->hasFile('agreement')) {
            $conference->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('case-conferences.show', $conference->id)
            ->with('success', 'Konferensi kasus dicatat.');
    }

    private function mediaItems(CaseConference $conference): array
    {
        return $conference->getMedia('documentation')
            ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl(), 'name' => $m->file_name])
            ->values()
            ->toArray();
    }

    private function agreementItem(CaseConference $conference): ?array
    {
        $media = $conference->getFirstMedia('agreements');

        return $media ? ['id' => $media->id, 'url' => $media->getUrl(), 'name' => $media->file_name] : null;
    }

    public function show(CaseConference $caseConference): Response
    {
        $caseConference->load(['caseRecord.student', 'counselor', 'academicYear']);

        return Inertia::render('CaseConferences/Show', [
            'conference' => $caseConference,
            'documentation' => $this->mediaItems($caseConference),
            'agreement' => $this->agreementItem($caseConference),
        ]);
    }

    public function edit(CaseConference $caseConference): Response
    {
        $caseConference->load(['caseRecord', 'academicYear']);

        return Inertia::render('CaseConferences/Edit', [
            'conference' => $caseConference,
            'cases' => CaseRecord::with('student')->orderByDesc('created_at')->get(['id', 'title', 'student_id']),
            'documentation' => $this->mediaItems($caseConference),
            'agreement' => $this->agreementItem($caseConference),
        ]);
    }

    public function update(Request $request, CaseConference $caseConference): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'topic' => 'required|string|max:255',
            'participants' => 'nullable|array',
            'participants.*.name' => 'required|string|max:100',
            'participants.*.role' => 'required|string|max:100',
            'notes' => 'nullable|string',
            'outcome' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
            'delete_media_ids' => 'nullable|array',
            'delete_media_ids.*' => 'integer',
            'documentation' => 'nullable|array',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'delete_agreement' => 'nullable|boolean',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $caseConference->update(\Arr::except($data, ['delete_media_ids', 'documentation', 'delete_agreement', 'agreement']));

        foreach ($request->input('delete_media_ids', []) as $mediaId) {
            $caseConference->media()->where('id', $mediaId)->first()?->delete();
        }

        $remaining = $caseConference->getMedia('documentation')->count();
        foreach ($request->file('documentation', []) as $file) {
            if ($remaining >= 2) {
                break;
            }
            $caseConference->addMedia($file)->toMediaCollection('documentation');
            $remaining++;
        }

        if ($request->boolean('delete_agreement')) {
            $caseConference->getFirstMedia('agreements')?->delete();
        }

        if ($request->hasFile('agreement')) {
            $caseConference->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('case-conferences.show', $caseConference)
            ->with('success', 'Konferensi kasus diperbarui.');
    }

    public function destroy(CaseConference $caseConference): RedirectResponse
    {
        $caseConference->delete();

        return redirect()->route('case-conferences.index')
            ->with('success', 'Konferensi kasus dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        CaseConference::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' konferensi kasus berhasil dihapus.');
    }
}
