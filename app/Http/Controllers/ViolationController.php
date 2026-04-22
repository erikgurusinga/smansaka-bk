<?php

namespace App\Http\Controllers;

use App\Models\Violation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ViolationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Violation::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        $violations = $query
            ->withCount('studentViolations')
            ->orderBy('category')
            ->orderBy('points', 'desc')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Violations/Index', [
            'violations' => $violations,
            'filters' => $request->only('search', 'category', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:200',
            'category' => 'required|in:ringan,sedang,berat',
            'points' => 'required|integer|min:1|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Violation::create($data);

        return back()->with('success', 'Jenis pelanggaran ditambahkan.');
    }

    public function update(Request $request, Violation $violation): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:200',
            'category' => 'required|in:ringan,sedang,berat',
            'points' => 'required|integer|min:1|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $violation->update($data);

        return back()->with('success', 'Jenis pelanggaran diperbarui.');
    }

    public function destroy(Violation $violation): RedirectResponse
    {
        if ($violation->studentViolations()->exists()) {
            return back()->with('error', 'Jenis pelanggaran ini sudah digunakan, tidak bisa dihapus.');
        }

        $violation->delete();

        return back()->with('success', 'Jenis pelanggaran dihapus.');
    }
}
