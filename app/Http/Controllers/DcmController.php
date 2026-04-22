<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\DcmItem;
use App\Models\DcmResponse;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DcmController extends Controller
{
    public function items(Request $request): Response
    {
        $query = DcmItem::query();

        if ($topic = $request->input('topic')) {
            $query->where('topic', $topic);
        }

        if ($search = $request->input('search')) {
            $query->where('question', 'like', "%{$search}%");
        }

        $items = $query->orderBy('topic_order')->orderBy('sort_order')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        $topics = DcmItem::select('topic', 'topic_order')
            ->distinct()
            ->orderBy('topic_order')
            ->pluck('topic');

        return Inertia::render('Instruments/Dcm/Items', [
            'items' => $items,
            'topics' => $topics,
            'filters' => $request->only('topic', 'search', 'per_page'),
        ]);
    }

    public function storeItem(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'topic' => 'required|string|max:100',
            'topic_order' => 'required|integer',
            'question' => 'required|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        DcmItem::create($data);

        return back()->with('success', 'Butir DCM ditambahkan.');
    }

    public function updateItem(Request $request, DcmItem $item): RedirectResponse
    {
        $data = $request->validate([
            'topic' => 'required|string|max:100',
            'topic_order' => 'required|integer',
            'question' => 'required|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $item->update($data);

        return back()->with('success', 'Butir DCM diperbarui.');
    }

    public function destroyItem(DcmItem $item): RedirectResponse
    {
        $item->delete();

        return back()->with('success', 'Butir DCM dihapus.');
    }

    public function responses(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $yearId = $request->input('academic_year_id', $activeYear?->id);

        $studentsQuery = Student::where('status', 'aktif')
            ->with(['schoolClass'])
            ->withCount([
                'dcmResponses as answered_count' => fn ($q) => $q
                    ->where('academic_year_id', $yearId)
                    ->where('checked', true),
            ]);

        if ($classId = $request->input('class_id')) {
            $studentsQuery->where('class_id', $classId);
        }

        if ($search = $request->input('search')) {
            $studentsQuery->where('name', 'like', "%{$search}%");
        }

        $students = $studentsQuery->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        return Inertia::render('Instruments/Dcm/Responses', [
            'students' => $students,
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name']),
            'academic_years' => AcademicYear::orderByDesc('year')->get(['id', 'year', 'semester']),
            'total_items' => DcmItem::where('is_active', true)->count(),
            'filters' => $request->only('search', 'class_id', 'academic_year_id', 'per_page'),
        ]);
    }

    public function fill(Request $request, Student $student): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $yearId = $request->input('academic_year_id', $activeYear->id);

        $items = DcmItem::where('is_active', true)
            ->orderBy('topic_order')->orderBy('sort_order')
            ->get(['id', 'topic', 'topic_order', 'question']);

        $responses = DcmResponse::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->pluck('checked', 'item_id');

        return Inertia::render('Instruments/Dcm/Fill', [
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
            DcmResponse::where('student_id', $student->id)
                ->where('academic_year_id', $data['academic_year_id'])
                ->delete();

            if (! empty($rows)) {
                DcmResponse::insert($rows);
            }
        });

        return redirect()->route('dcm.result', ['student' => $student->id, 'academic_year_id' => $data['academic_year_id']])
            ->with('success', 'Jawaban DCM tersimpan.');
    }

    public function result(Request $request, Student $student): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->firstOrFail();
        $yearId = $request->input('academic_year_id', $activeYear->id);

        $responses = DcmResponse::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->where('checked', true)
            ->with('item')
            ->get();

        $totalsByTopic = DcmItem::where('is_active', true)
            ->selectRaw('topic, topic_order, count(*) as total')
            ->groupBy('topic', 'topic_order')
            ->orderBy('topic_order')
            ->get();

        $byTopic = $responses->groupBy('item.topic')->map(fn ($group) => [
            'count' => $group->count(),
            'items' => $group->map(fn ($r) => [
                'id' => $r->item->id,
                'question' => $r->item->question,
            ])->values(),
        ]);

        return Inertia::render('Instruments/Dcm/Result', [
            'student' => $student->load('schoolClass'),
            'by_topic' => $byTopic,
            'topic_totals' => $totalsByTopic,
            'academic_year' => AcademicYear::find($yearId),
        ]);
    }
}
