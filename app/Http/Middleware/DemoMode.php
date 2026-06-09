<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Saat DEMO_MODE aktif, blokir aksi tulis pada route kritis (kelola user,
 * ganti password, branding) supaya pengunjung tidak bisa merusak akun /
 * tampilan demo. Modul fungsional dibiarkan terbuka — datanya direset berkala.
 */
class DemoMode
{
    /** Method yang dianggap "menulis". */
    private const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('demo.enabled')) {
            return $next($request);
        }

        if (in_array($request->method(), self::WRITE_METHODS, true) && $this->isProtected($request)) {
            $message = 'Aksi ini dinonaktifkan dalam mode demo.';

            if ($request->header('X-Inertia')) {
                return back()->with('error', $message);
            }

            return back()->withErrors(['demo' => $message]);
        }

        return $next($request);
    }

    private function isProtected(Request $request): bool
    {
        $name = $request->route()?->getName();

        if (! $name) {
            return false;
        }

        foreach ((array) config('demo.protected_routes', []) as $pattern) {
            if (Str::is($pattern, $name)) {
                return true;
            }
        }

        return false;
    }
}
