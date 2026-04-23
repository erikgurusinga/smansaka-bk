<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuardianController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Guardian::query()->withCount('students');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($relation = $request->input('relation')) {
            $query->where('relation', $relation);
        }

        $parents = $query
            ->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        $parents->through(function (Guardian $p) {
            $p->photo_url = $p->getFirstMediaUrl('photo');

            return $p;
        });

        return Inertia::render('Parents/Index', [
            'parents' => $parents,
            'filters' => $request->only('search', 'relation', 'per_page'),
        ]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $results = Guardian::query()
            ->where('name', 'like', "%{$q}%")
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name', 'relation', 'phone'])
            ->map(fn (Guardian $g) => [
                'id' => $g->id,
                'name' => $g->name,
                'relation' => $g->relation,
                'phone' => $g->phone,
            ]);

        return response()->json($results);
    }

    public function linkedStudents(Guardian $parent): JsonResponse
    {
        $students = $parent->students()
            ->with('schoolClass:id,name')
            ->orderBy('students.name')
            ->get(['students.id', 'students.nis', 'students.name', 'students.gender', 'students.class_id', 'students.status'])
            ->map(fn (Student $s) => [
                'id' => $s->id,
                'nis' => $s->nis,
                'name' => $s->name,
                'gender' => $s->gender,
                'status' => $s->status,
                'class_name' => $s->schoolClass?->name,
                'photo_url' => $s->getFirstMediaUrl('photo'),
            ]);

        return response()->json($students);
    }

    public function updatePhoto(Request $request, Guardian $parent): RedirectResponse
    {
        $request->validate(['photo' => 'required|image|max:2048']);
        $parent->addMediaFromRequest('photo')->toMediaCollection('photo');

        return back()->with('success', 'Foto orang tua diperbarui.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'relation' => 'required|in:ayah,ibu,wali',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'occupation' => 'nullable|string|max:100',
            'address' => 'nullable|string',
        ]);

        Guardian::create($data);

        return back()->with('success', 'Orang tua / wali berhasil ditambahkan.');
    }

    public function update(Request $request, Guardian $parent): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'relation' => 'required|in:ayah,ibu,wali',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'occupation' => 'nullable|string|max:100',
            'address' => 'nullable|string',
        ]);

        $parent->update($data);

        return back()->with('success', 'Data orang tua diperbarui.');
    }

    public function destroy(Guardian $parent): RedirectResponse
    {
        $parent->delete();

        return back()->with('success', 'Orang tua / wali berhasil dihapus.');
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer'])['ids'];
        Guardian::whereIn('id', $ids)->get()->each->delete();

        return back()->with('success', count($ids).' data orang tua berhasil dihapus.');
    }
}
