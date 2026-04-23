<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CounselingParticipant;
use App\Models\CounselingSession;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentGuidance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class IndividualCounselingController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = CounselingSession::query()
            ->where('type', 'individual')
            ->with(['students', 'counselor', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $ay) => $q->where('academic_year_id', $ay))
            ->when(! $request->input('academic_year_id') && $activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id));

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('topic', 'like', "%{$search}%")
                    ->orWhereHas('students', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sessions = $query
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Counseling/Individual/Index', [
            'sessions' => $sessions,
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
                ->orderBy('level')->orderBy('name')
                ->get(['id', 'name', 'level']);
        } else {
            $classes = SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']);
        }

        return Inertia::render('Counseling/Individual/Create', [
            'classes' => $classes,
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:1|max:480',
            'topic' => 'required|string|max:255',
            'description' => 'nullable|string',
            'outcome' => 'nullable|string',
            'next_plan' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,berlangsung,selesai,dibatalkan',
            'is_confidential' => 'boolean',
            'documentation' => 'nullable|array|max:2',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $studentId = $data['student_id'];
        unset($data['student_id'], $data['documentation'], $data['agreement']);

        $data['type'] = 'individual';
        $data['counselor_id'] = Auth::id();

        $session = CounselingSession::create($data);
        CounselingParticipant::create([
            'counseling_session_id' => $session->id,
            'student_id' => $studentId,
        ]);

        foreach ($request->file('documentation', []) as $file) {
            $session->addMedia($file)->toMediaCollection('documentation');
        }

        if ($request->hasFile('agreement')) {
            $session->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('counseling.individual.index')
            ->with('success', 'Sesi konseling dicatat.');
    }

    private function mediaItems(CounselingSession $session): array
    {
        return $session->getMedia('documentation')
            ->map(fn ($m) => ['id' => $m->id, 'url' => $m->getUrl(), 'name' => $m->file_name])
            ->values()
            ->toArray();
    }

    private function agreementItem(CounselingSession $session): ?array
    {
        $media = $session->getFirstMedia('agreements');

        return $media ? ['id' => $media->id, 'url' => $media->getUrl(), 'name' => $media->file_name] : null;
    }

    public function show(CounselingSession $session): Response
    {
        $session->load(['students.schoolClass', 'students.media', 'counselor', 'academicYear']);
        $student = $session->students->first();

        return Inertia::render('Counseling/Individual/Show', [
            'session' => $session,
            'documentation' => $this->mediaItems($session),
            'agreement' => $this->agreementItem($session),
            'student_photo' => $student?->getFirstMediaUrl('photo') ?: null,
        ]);
    }

    public function edit(CounselingSession $session): Response
    {
        $session->load(['students', 'academicYear']);

        return Inertia::render('Counseling/Individual/Edit', [
            'session' => $session,
            'documentation' => $this->mediaItems($session),
            'agreement' => $this->agreementItem($session),
            'students' => Student::where('status', 'aktif')->orderBy('name')->get(['id', 'nis', 'name', 'class_id']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
        ]);
    }

    public function update(Request $request, CounselingSession $session): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:1|max:480',
            'topic' => 'required|string|max:255',
            'description' => 'nullable|string',
            'outcome' => 'nullable|string',
            'next_plan' => 'nullable|string',
            'status' => 'required|in:dijadwalkan,berlangsung,selesai,dibatalkan',
            'is_confidential' => 'boolean',
            'delete_media_ids' => 'nullable|array',
            'delete_media_ids.*' => 'integer',
            'documentation' => 'nullable|array',
            'documentation.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
            'delete_agreement' => 'nullable|boolean',
            'agreement' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $session->update(\Arr::except($data, ['delete_media_ids', 'documentation', 'delete_agreement', 'agreement']));

        foreach ($request->input('delete_media_ids', []) as $mediaId) {
            $session->media()->where('id', $mediaId)->first()?->delete();
        }

        $remaining = $session->getMedia('documentation')->count();
        foreach ($request->file('documentation', []) as $file) {
            if ($remaining >= 2) {
                break;
            }
            $session->addMedia($file)->toMediaCollection('documentation');
            $remaining++;
        }

        if ($request->boolean('delete_agreement')) {
            $session->getFirstMedia('agreements')?->delete();
        }

        if ($request->hasFile('agreement')) {
            $session->addMedia($request->file('agreement'))->toMediaCollection('agreements');
        }

        return redirect()->route('counseling.individual.show', $session)
            ->with('success', 'Sesi konseling diperbarui.');
    }

    public function destroy(CounselingSession $session): RedirectResponse
    {
        $session->delete();

        return redirect()->route('counseling.individual.index')
            ->with('success', 'Sesi konseling dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        CounselingSession::whereIn('id', $ids)->where('type', 'individual')->delete();

        return back()->with('success', count($ids).' sesi konseling berhasil dihapus.');
    }
}
