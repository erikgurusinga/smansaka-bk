<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Teacher::query()->with('user');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%");
            });
        }

        if ($request->input('is_bk') !== null && $request->input('is_bk') !== '') {
            $query->where('is_bk', (bool) $request->input('is_bk'));
        }

        $teachers = $query
            ->orderBy('name')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        $users = User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'username']);

        return Inertia::render('Teachers/Index', [
            'teachers' => $teachers,
            'users' => $users,
            'filters' => $request->only('search', 'is_bk', 'per_page'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nip' => 'nullable|string|unique:teachers,nip',
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'is_bk' => 'boolean',
            'user_id' => 'nullable|exists:users,id',
        ]);

        Teacher::create($data);

        return back()->with('success', 'Guru berhasil ditambahkan.');
    }

    public function update(Request $request, Teacher $teacher): RedirectResponse
    {
        $data = $request->validate([
            'nip' => "nullable|string|unique:teachers,nip,{$teacher->id}",
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'is_bk' => 'boolean',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $teacher->update($data);

        return back()->with('success', 'Data guru diperbarui.');
    }

    public function destroy(Teacher $teacher): RedirectResponse
    {
        $teacher->delete();

        return back()->with('success', 'Guru berhasil dihapus.');
    }
}
