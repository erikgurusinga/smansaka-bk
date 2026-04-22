<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\AkpdItem;
use App\Models\AkpdResponse;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AkpdController extends Controller
{
    public function items(Request $request): Response
    {
        $query = AkpdItem::query();

        if ($bidang = $request->input('bidang')) {
            $query->where('bidang', $bidang);
        }

        if ($search = $request->input('search')) {
            $query->where('question', 'like', "%{$search}%");
        }

        $items = $query->orderBy('bidang')->orderBy('sort_order')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Instruments/Akpd/Items', [
            'items' => $items,
            'filters' => $request->only('bidang', 'search', 'per_page'),
        ]);
    }

    public function storeItem(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'bidang' => 'required|in:pribadi,sosial,belajar,karier',
            'question' => 'required|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        AkpdItem::create($data);

        return back()->with('success', 'Butir AKPD ditambahkan.');
    }

    public function updateItem(Request $request, AkpdItem $item): RedirectResponse
    {
        $data = $request->validate([
            'bidang' => 'required|in:pribadi,sosial,belajar,karier',
            'question' => 'required|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $item->update($data);

        return back()->with('success', 'Butir AKPD diperbarui.');
    }

    public function destroyItem(AkpdItem $item): RedirectResponse
    {
        $item->delete();

        return back()->with('success', 'Butir AKPD dihapus.');
    }

    public function responses(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $yearId = $request->input('academic_year_id', $activeYear?->id);
        $classId = $request->input('class_id');

        $studentsQuery = Student::where('status', 'aktif')
            ->with(['schoolClass'])
            ->withCount([
                'akpdResponses as answered_count' => fn ($q) => $q
                    ->where('academic_year_id', $yearId)
                    ->where('checked', true),
            ]);

        if ($classId) {
            $studentsQuery->where('class_id', $classId);
        }

        if ($search = $request->input('search')) {
            $studentsQuery->where('name', 'like', "%{$search}%");
        }

        $students = $studentsQuery->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Instruments/Akpd/Responses', [
            'students' => $students,
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'total_items' => AkpdItem::where('is_active', true)->count(),
            'filters' => $request->only('search', 'class_id', 'academic_year_id', 'per_page'),
        ]);
    }

    public function fill(Request $request, Student $student): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $yearId = $request->input('academic_year_id', $activeYear->id);

        $items = AkpdItem::where('is_active', true)
            ->orderBy('bidang')->orderBy('sort_order')
            ->get(['id', 'bidang', 'question']);

        $responses = AkpdResponse::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->pluck('checked', 'item_id');

        return Inertia::render('Instruments/Akpd/Fill', [
            'student' => $student->load('schoolClass'),
            'items' => $items,
            'responses' => $responses,
            'academic_year' => AcademicYear::find($yearId),
        ]);
    }

    public function submit(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'answers' => 'required|array',
            'answers.*' => 'boolean',
        ]);

        $now = now();
        $rows = [];
        foreach ($data['answers'] as $itemId => $checked) {
            $rows[] = [
                'student_id' => $student->id,
                'academic_year_id' => $data['academic_year_id'],
                'item_id' => (int) $itemId,
                'checked' => (bool) $checked,
                'submitted_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::transaction(function () use ($student, $data, $rows) {
            AkpdResponse::where('student_id', $student->id)
                ->where('academic_year_id', $data['academic_year_id'])
                ->delete();

            if (! empty($rows)) {
                AkpdResponse::insert($rows);
            }
        });

        return redirect()->route('akpd.result', ['student' => $student->id, 'academic_year_id' => $data['academic_year_id']])
            ->with('success', 'Jawaban AKPD tersimpan.');
    }

    public function result(Request $request, Student $student): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $yearId = $request->input('academic_year_id', $activeYear->id);

        $responses = AkpdResponse::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->where('checked', true)
            ->with('item')
            ->get();

        $byBidang = $responses->groupBy('item.bidang')->map(fn ($group) => [
            'count' => $group->count(),
            'items' => $group->map(fn ($r) => [
                'id' => $r->item->id,
                'question' => $r->item->question,
            ])->values(),
        ]);

        $totals = [
            'pribadi' => AkpdItem::where('bidang', 'pribadi')->where('is_active', true)->count(),
            'sosial' => AkpdItem::where('bidang', 'sosial')->where('is_active', true)->count(),
            'belajar' => AkpdItem::where('bidang', 'belajar')->where('is_active', true)->count(),
            'karier' => AkpdItem::where('bidang', 'karier')->where('is_active', true)->count(),
        ];

        return Inertia::render('Instruments/Akpd/Result', [
            'student' => $student->load('schoolClass'),
            'by_bidang' => $byBidang,
            'totals' => $totals,
            'academic_year' => AcademicYear::find($yearId),
        ]);
    }
}
