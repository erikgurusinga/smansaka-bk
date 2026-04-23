<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CaseRecord;
use App\Models\Referral;
use App\Models\SchoolClass;
use App\Services\PdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReferralController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = Referral::query()
            ->with(['student.schoolClass', 'caseRecord', 'counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->whereHas('student', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $records = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Referrals/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Referrals/Create', [
            'classes' => SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']),
            'cases' => CaseRecord::with('student')->orderByDesc('created_at')->get(['id', 'title', 'student_id']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'case_id' => 'nullable|exists:cases,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'referred_to' => 'required|string|max:255',
            'reason' => 'required|string',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:aktif,diterima,ditolak,selesai',
            'documentation' => 'nullable|array|max:2',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        unset($data['documentation'], $data['agreement']);
        $data['counselor_id'] = Auth::id();

        $referral = Referral::create($data);

        foreach ($request->file('documentation', []) as $file) {
            $referral->addMedia($file)->toMediaCollection('documentation');
        }

        if ($request->hasFile('agreement')) {
            $referral->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('referrals.show', $referral->id)
            ->with('success', 'Referral dicatat.');
    }

    private function mediaItems(Referral $referral): array
    {
        return $referral->getMedia('documentation')
            ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl(), 'name' => $m->file_name])
            ->values()
            ->toArray();
    }

    private function agreementItem(Referral $referral): ?array
    {
        $media = $referral->getFirstMedia('agreements');

        return $media ? ['id' => $media->id, 'url' => $media->getUrl(), 'name' => $media->file_name] : null;
    }

    public function show(Referral $referral): Response
    {
        $referral->load(['student.schoolClass', 'student.media', 'caseRecord', 'counselor', 'academicYear']);

        return Inertia::render('Referrals/Show', [
            'referral' => $referral,
            'documentation' => $this->mediaItems($referral),
            'agreement' => $this->agreementItem($referral),
            'student_photo' => $referral->student?->getFirstMediaUrl('photo') ?: null,
        ]);
    }

    public function edit(Referral $referral): Response
    {
        $referral->load(['student.schoolClass', 'caseRecord', 'academicYear']);

        return Inertia::render('Referrals/Edit', [
            'referral' => $referral,
            'cases' => CaseRecord::with('student')->orderByDesc('created_at')->get(['id', 'title', 'student_id']),
            'documentation' => $this->mediaItems($referral),
            'agreement' => $this->agreementItem($referral),
        ]);
    }

    public function update(Request $request, Referral $referral): RedirectResponse
    {
        $data = $request->validate([
            'referred_to' => 'required|string|max:255',
            'reason' => 'required|string',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:aktif,diterima,ditolak,selesai',
            'delete_media_ids' => 'nullable|array',
            'delete_media_ids.*' => 'integer',
            'documentation' => 'nullable|array',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'delete_agreement' => 'nullable|boolean',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $referral->update(\Arr::except($data, ['delete_media_ids', 'documentation', 'delete_agreement', 'agreement']));

        foreach ($request->input('delete_media_ids', []) as $mediaId) {
            $referral->media()->where('id', $mediaId)->first()?->delete();
        }

        $remaining = $referral->getMedia('documentation')->count();
        foreach ($request->file('documentation', []) as $file) {
            if ($remaining >= 2) {
                break;
            }
            $referral->addMedia($file)->toMediaCollection('documentation');
            $remaining++;
        }

        if ($request->boolean('delete_agreement')) {
            $referral->getFirstMedia('agreements')?->delete();
        }

        if ($request->hasFile('agreement')) {
            $referral->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('referrals.show', $referral)
            ->with('success', 'Referral diperbarui.');
    }

    public function destroy(Referral $referral): RedirectResponse
    {
        $referral->delete();

        return redirect()->route('referrals.index')
            ->with('success', 'Referral dihapus.');
    }

    public function pdf(Referral $referral): SymfonyResponse
    {
        $referral->load(['student.schoolClass', 'caseRecord', 'counselor', 'academicYear']);

        return PdfService::inline('pdf.referral', ['referral' => $referral], 'surat-rujukan');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        Referral::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' referral berhasil dihapus.');
    }
}
