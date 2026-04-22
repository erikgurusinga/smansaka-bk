<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckModuleAccess
{
    /**
     * Handle an incoming request.
     *
     * Gunakan: Route::middleware('module:students,read')
     *     atau: Route::middleware('module:students,write')
     */
    public function handle(Request $request, Closure $next, string $module, string $ability = 'read'): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Super admin (id=1) selalu lolos
        if ($user->id === 1) {
            return $next($request);
        }

        if (! $user->hasModuleAccess($module, $ability)) {
            abort(403, 'Anda tidak memiliki akses ke modul ini.');
        }

        return $next($request);
    }
}
