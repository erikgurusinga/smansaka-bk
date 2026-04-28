<?php

namespace App\Http\Middleware;

use App\Models\AcademicYear;
use App\Models\Module;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => fn () => [
                'user' => $request->user() ? array_merge(
                    $request->user()->only(['id', 'username', 'name', 'email', 'photo', 'position', 'groups']),
                    ['photo_url' => $request->user()->photo_url]
                ) : null,
            ],
            'permissions' => fn () => $this->getPermissions($request),
            'branding' => fn () => $this->getBranding(),
            'academic_year' => fn () => $this->getActiveAcademicYear(),
            'app' => [
                'name' => config('app.name'),
                'url' => config('app.url'),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ]);
    }

    protected function getPermissions(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [];
        }

        // Super admin (id=1) punya semua akses
        if ($user->id === 1) {
            return Module::where('is_active', true)
                ->pluck('slug')
                ->mapWithKeys(fn ($slug) => [$slug => ['read' => true, 'write' => true]])
                ->toArray();
        }

        return $user->getPermissionsMap();
    }

    protected function getBranding(): array
    {
        $keys = ['site_name', 'site_short_name', 'logo', 'favicon', 'footer_text', 'school_name'];
        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key');

        $logo = $settings->get('logo');
        $favicon = $settings->get('favicon');

        return [
            'site_name' => $settings->get('site_name') ?? config('app.name'),
            'site_short_name' => $settings->get('site_short_name') ?? 'BK SMANSAKA',
            'logo' => $logo ? asset('storage/'.$logo) : null,
            'favicon' => $favicon ? asset('storage/'.$favicon) : null,
            'footer_text' => $settings->get('footer_text') ?? '',
            'school_name' => $settings->get('school_name') ?? '',
        ];
    }

    protected function getActiveAcademicYear(): ?array
    {
        $year = AcademicYear::where('is_active', true)->first();

        return $year?->only(['id', 'year', 'semester', 'start_date', 'end_date']);
    }
}
