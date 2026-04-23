<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CaseRecord;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CaseController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $query = CaseRecord::query()
            ->with(['student.schoolClass', 'reporter', 'academicYear'])
            ->visibleTo($user);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('student', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($ayId = $request->input('academic_year_id')) {
            $query->where('academic_year_id', $ayId);
        }

        $cases = $query
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Cases/Index', [
            'cases' => $cases,
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'filters' => $request->only('search', 'category', 'status', 'academic_year_id', 'per_page'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Cases/Create', [
            'classes' => SchoolClass::orderBy('level')->orderBy('name')->get(['id', 'name', 'level']),
            'academic_year' => AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'category' => 'required|in:akademik,pribadi,sosial,karier,pelanggaran',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'is_confidential' => 'boolean',
        ]);

        $data['reported_by'] = Auth::id();
        $data['status'] = 'baru';

        CaseRecord::create($data);

        return redirect()->route('cases.index')->with('success', 'Kasus berhasil dicatat.');
    }

    public function show(CaseRecord $case): Response
    {
        $user = Auth::user();

        // Cek akses — scope sudah handle di query, tapi untuk show langsung perlu cek manual
        if (
            $case->is_confidential &&
            $case->reported_by !== $user->id &&
            ! $user->isSuperAdmin() &&
            ! in_array('koordinator_bk', $user->groupSlugs()) &&
            ! in_array($user->id, $case->visible_to ?? [])
        ) {
            abort(403, 'Anda tidak memiliki akses ke catatan ini.');
        }

        $case->load(['student.schoolClass', 'student.media', 'reporter', 'academicYear']);

        return Inertia::render('Cases/Show', [
            'case' => $case,
            'student_photo' => $case->student?->getFirstMediaUrl('photo') ?: null,
        ]);
    }

    public function edit(CaseRecord $case): Response
    {
        $case->load(['student', 'academicYear']);

        return Inertia::render('Cases/Edit', [
            'case' => $case,
            'students' => Student::where('status', 'aktif')->orderBy('name')
                ->get(['id', 'nis', 'name', 'class_id']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
        ]);
    }

    public function update(Request $request, CaseRecord $case): RedirectResponse
    {
        $data = $request->validate([
            'category' => 'required|in:akademik,pribadi,sosial,karier,pelanggaran',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|in:baru,penanganan,selesai,rujukan',
            'is_confidential' => 'boolean',
        ]);

        if ($data['status'] === 'selesai' && $case->status !== 'selesai') {
            $data['resolved_at'] = now();
        }

        $case->update($data);

        return back()->with('success', 'Kasus diperbarui.');
    }

    public function destroy(CaseRecord $case): RedirectResponse
    {
        $case->delete();

        return redirect()->route('cases.index')->with('success', 'Kasus dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        CaseRecord::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' kasus berhasil dihapus.');
    }
}
