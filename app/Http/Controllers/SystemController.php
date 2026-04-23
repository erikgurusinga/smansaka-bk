<?php

namespace App\Http\Controllers;

use App\Models\GroupAccess;
use App\Models\Module;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class SystemController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::orderBy('id')
            ->get(['id', 'username', 'name', 'email', 'position', 'phone', 'groups', 'is_active', 'last_login_at']);

        $groups = UserGroup::with(['accesses.module'])
            ->orderBy('id')
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'slug' => $g->slug,
                'description' => $g->description,
                'is_system' => $g->is_system,
                'accesses' => $g->accesses
                    ->filter(fn ($a) => $a->module !== null)
                    ->mapWithKeys(fn ($a) => [
                        $a->module->slug => ['read' => $a->can_read, 'write' => $a->can_write],
                    ]),
            ]);

        $modules = Module::orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'parent_slug', 'is_active']);

        $settings = Setting::whereIn('key', ['site_name', 'site_short_name', 'school_name', 'school_address'])
            ->get()
            ->mapWithKeys(fn ($s) => [$s->key => ['value' => $s->value ?? '', 'label' => $s->label]]);

        $activityLog = Activity::with('causer:id,name,username')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('System/Index', [
            'system_users' => $users,
            'groups' => $groups,
            'modules' => $modules,
            'settings' => $settings,
            'activity_log' => $activityLog,
        ]);
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'name' => 'required|string|max:100',
            'email' => 'nullable|email|max:100|unique:users,email',
            'password' => 'required|string|min:8',
            'position' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'groups' => 'nullable|array',
            'groups.*' => 'integer|exists:user_groups,id',
            'is_active' => 'boolean',
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['groups'] = $data['groups'] ?? [];

        User::create($data);

        return back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:50', Rule::unique('users', 'username')->ignore($user->id)],
            'name' => 'required|string|max:100',
            'email' => ['nullable', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'position' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'groups' => 'nullable|array',
            'groups.*' => 'integer|exists:user_groups,id',
            'is_active' => 'boolean',
        ]);

        if ($user->isSuperAdmin()) {
            unset($data['username'], $data['groups'], $data['is_active']);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        if (! $user->isSuperAdmin()) {
            $data['groups'] = $data['groups'] ?? [];
        }

        $user->update($data);
        $user->clearPermissionsCache();

        return back()->with('success', 'Data pengguna diperbarui.');
    }

    public function destroyUser(User $user): RedirectResponse
    {
        if ($user->isSuperAdmin()) {
            return back()->with('error', 'Super Admin tidak bisa dihapus.');
        }

        $user->delete();

        return back()->with('success', 'Pengguna berhasil dihapus.');
    }

    public function updateGroupAccess(Request $request, UserGroup $group): RedirectResponse
    {
        $data = $request->validate([
            'accesses' => 'present|array',
            'accesses.*.module_id' => 'required|integer|exists:modules,id',
            'accesses.*.can_read' => 'required|boolean',
            'accesses.*.can_write' => 'required|boolean',
        ]);

        GroupAccess::where('group_id', $group->id)->delete();

        foreach ($data['accesses'] as $access) {
            if ($access['can_read'] || $access['can_write']) {
                GroupAccess::create([
                    'group_id' => $group->id,
                    'module_id' => $access['module_id'],
                    'can_read' => $access['can_read'],
                    'can_write' => $access['can_write'],
                ]);
            }
        }

        User::all()->each(function ($u) use ($group) {
            if (in_array($group->id, $u->groups ?? [])) {
                $u->clearPermissionsCache();
            }
        });

        return back()->with('success', 'Hak akses grup "'.$group->name.'" diperbarui.');
    }

    public function updateBranding(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'site_name' => 'required|string|max:100',
            'site_short_name' => 'required|string|max:50',
            'school_name' => 'required|string|max:100',
            'school_address' => 'nullable|string|max:255',
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, $value ?? '');
        }

        return back()->with('success', 'Pengaturan branding disimpan.');
    }
}
