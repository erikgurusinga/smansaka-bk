<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
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

        return Inertia::render('Parents/Index', [
            'parents' => $parents,
            'filters' => $request->only('search', 'relation', 'per_page'),
        ]);
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
}
