<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\HomeVisit;
use App\Models\SchoolClass;
use App\Models\StudentGuidance;
use App\Models\Teacher;
use App\Services\PdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HomeVisitController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = HomeVisit::query()
            ->with(['student.schoolClass', 'counselor', 'academicYear'])
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

        return Inertia::render('Counseling/HomeVisit/Index', [
            'records' => $records,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'active_year' => $activeYear,
            'filters' => $request->only('search', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        $user = Auth::user();
        $slugs = $user->groupSlugs();
        $isGuruBk = in_array('guru-bk', $slugs)
            && ! $user->isSuperAdmin()
            && ! in_array('koordinator-bk', $slugs);

        if ($isGuruBk) {
            $classIds = StudentGuidance::where('user_id', $user->id)
                ->join('students', 'students.id', '=', 'student_guidance.student_id')
                ->distinct()
                ->pluck('students.class_id');
            $classes = SchoolClass::whereIn('id', $classIds)
                ->orderBy('level')->orderBy('name')->get(['id', 'name', 'level']);
        } else {
            $classes = SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']);
        }

        return Inertia::render('Counseling/HomeVisit/Create', [
            'classes' => $classes,
            'academic_year' => AcademicYear::where('is_active', true)->first(),
            'teachers' => Teacher::orderBy('name')->get(['id', 'name', 'is_bk']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'companions' => 'nullable|array',
            'companions.*.name' => 'required|string|max:100',
            'companions.*.role' => 'required|string|max:100',
            'purpose' => 'required|string',
            'findings' => 'nullable|string',
            'action_plan' => 'nullable|string',
            'signature_student' => 'nullable|string',
            'signature_parent' => 'nullable|string',
            'signature_counselor' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
            'documentation' => 'nullable|array|max:2',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        unset($data['documentation'], $data['agreement']);
        $data['counselor_id'] = Auth::id();

        $visit = HomeVisit::create($data);

        foreach ($request->file('documentation', []) as $file) {
            $visit->addMedia($file)->toMediaCollection('documentation');
        }

        if ($request->hasFile('agreement')) {
            $visit->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('home-visits.show', $visit->id)
            ->with('success', 'Home visit dicatat.');
    }

    private function mediaItems(HomeVisit $visit): array
    {
        return $visit->getMedia('documentation')
            ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl(), 'name' => $m->file_name])
            ->values()
            ->toArray();
    }

    private function agreementItem(HomeVisit $visit): ?array
    {
        $media = $visit->getFirstMedia('agreements');

        return $media ? ['id' => $media->id, 'url' => $media->getUrl(), 'name' => $media->file_name] : null;
    }

    public function show(HomeVisit $homeVisit): Response
    {
        $homeVisit->makeVisible(['signature_student', 'signature_parent', 'signature_counselor']);
        $homeVisit->load(['student.schoolClass', 'student.media', 'counselor', 'academicYear']);

        return Inertia::render('Counseling/HomeVisit/Show', [
            'visit' => $homeVisit,
            'documentation' => $this->mediaItems($homeVisit),
            'agreement' => $this->agreementItem($homeVisit),
            'student_photo' => $homeVisit->student?->getFirstMediaUrl('photo') ?: null,
        ]);
    }

    public function edit(HomeVisit $homeVisit): Response
    {
        $homeVisit->load(['student.schoolClass', 'academicYear']);

        return Inertia::render('Counseling/HomeVisit/Edit', [
            'visit' => $homeVisit,
            'documentation' => $this->mediaItems($homeVisit),
            'agreement' => $this->agreementItem($homeVisit),
            'teachers' => Teacher::orderBy('name')->get(['id', 'name', 'is_bk']),
        ]);
    }

    public function update(Request $request, HomeVisit $homeVisit): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'companions' => 'nullable|array',
            'companions.*.name' => 'required|string|max:100',
            'companions.*.role' => 'required|string|max:100',
            'purpose' => 'required|string',
            'findings' => 'nullable|string',
            'action_plan' => 'nullable|string',
            'signature_student' => 'nullable|string',
            'signature_parent' => 'nullable|string',
            'signature_counselor' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,selesai',
            'delete_media_ids' => 'nullable|array',
            'delete_media_ids.*' => 'integer',
            'documentation' => 'nullable|array',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'delete_agreement' => 'nullable|boolean',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $homeVisit->update(\Arr::except($data, ['delete_media_ids', 'documentation', 'delete_agreement', 'agreement']));

        foreach ($request->input('delete_media_ids', []) as $mediaId) {
            $homeVisit->media()->where('id', $mediaId)->first()?->delete();
        }

        $remaining = $homeVisit->getMedia('documentation')->count();
        foreach ($request->file('documentation', []) as $file) {
            if ($remaining >= 2) {
                break;
            }
            $homeVisit->addMedia($file)->toMediaCollection('documentation');
            $remaining++;
        }

        if ($request->boolean('delete_agreement')) {
            $homeVisit->getFirstMedia('agreements')?->delete();
        }

        if ($request->hasFile('agreement')) {
            $homeVisit->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('home-visits.show', $homeVisit)
            ->with('success', 'Home visit diperbarui.');
    }

    public function destroy(HomeVisit $homeVisit): RedirectResponse
    {
        $homeVisit->delete();

        return redirect()->route('home-visits.index')
            ->with('success', 'Home visit dihapus.');
    }

    public function pdf(HomeVisit $homeVisit): SymfonyResponse
    {
        $homeVisit->makeVisible(['signature_student', 'signature_parent', 'signature_counselor']);
        $homeVisit->load(['student.schoolClass', 'counselor', 'academicYear']);

        return PdfService::inline('pdf.home-visit', ['visit' => $homeVisit], 'berita-acara-home-visit');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        HomeVisit::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' home visit berhasil dihapus.');
    }
}
