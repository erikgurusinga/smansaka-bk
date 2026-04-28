<?php

namespace App\Http\Controllers;

use App\Models\GroupAccess;
use App\Models\Module;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class SystemController extends Controller
{
    private const TEXT_SETTING_KEYS = [
        'site_name', 'site_short_name', 'footer_text',
        'school_name', 'school_address', 'npsn',
        'school_phone', 'school_email', 'school_website',
        'principal_name', 'principal_nip',
        'coordinator_name', 'coordinator_nip',
    ];

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

        $settings = Setting::whereIn('key', self::TEXT_SETTING_KEYS)
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
            'footer_text' => 'nullable|string|max:500',
            'school_name' => 'required|string|max:100',
            'school_address' => 'nullable|string|max:500',
            'npsn' => 'nullable|string|max:20',
            'school_phone' => 'nullable|string|max:30',
            'school_email' => 'nullable|email|max:100',
            'school_website' => 'nullable|string|max:100',
            'principal_name' => 'nullable|string|max:100',
            'principal_nip' => 'nullable|string|max:30',
            'coordinator_name' => 'nullable|string|max:100',
            'coordinator_nip' => 'nullable|string|max:30',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'favicon' => 'nullable|image|mimes:jpg,jpeg,png,ico,webp|max:512',
        ]);

        $textKeys = [
            'site_name', 'site_short_name', 'footer_text',
            'school_name', 'school_address', 'npsn',
            'school_phone', 'school_email', 'school_website',
            'principal_name', 'principal_nip', 'coordinator_name', 'coordinator_nip',
        ];

        foreach ($textKeys as $key) {
            Setting::set($key, $data[$key] ?? '');
        }

        if ($request->hasFile('logo')) {
            $this->storeFile('logo', $request->file('logo'));
        }

        if ($request->hasFile('favicon')) {
            $this->storeFile('favicon', $request->file('favicon'));
        }

        return back()->with('success', 'Profil sekolah berhasil disimpan.');
    }

    public function updateLogo(Request $request): RedirectResponse
    {
        $request->validate(['logo' => 'required|image|mimes:jpg,jpeg,png,svg,webp|max:2048']);
        $this->storeFile('logo', $request->file('logo'));

        return back()->with('success', 'Logo berhasil diperbarui.');
    }

    public function updateFavicon(Request $request): RedirectResponse
    {
        $request->validate(['favicon' => 'required|image|mimes:jpg,jpeg,png,ico,webp|max:512']);
        $this->storeFile('favicon', $request->file('favicon'));

        return back()->with('success', 'Favicon berhasil diperbarui.');
    }

    private function storeFile(string $key, UploadedFile $file): void
    {
        $old = Setting::where('key', $key)->value('value');
        if ($old) {
            Storage::disk('public')->delete($old);
        }

        $path = $file->store('branding', 'public');
        Setting::set($key, $path);
    }
}
