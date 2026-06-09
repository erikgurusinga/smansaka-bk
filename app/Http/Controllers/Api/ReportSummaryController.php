<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Endpoint laporan untuk Hub aggregator. Auth via header X-Api-Key.
 * Format generic: { title, metrics[], rows[], note }
 */
class ReportSummaryController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $expected = (string) env('HUB_REPORT_KEY', '');
        $given = (string) $request->header('X-Api-Key', '');
        if ($expected === '' || ! hash_equals($expected, $given)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $totalSiswa = DB::table('students')->where('status', 'aktif')->count();
        $kasusAktif = DB::table('cases')->where('status', '!=', 'selesai')->count();
        $kasusBulanIni = DB::table('cases')->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)->count();
        $totalGuru = DB::table('teachers')->count();
        $kategoriRows = DB::table('cases')
            ->select('category', DB::raw('COUNT(*) as cnt'))
            ->groupBy('category')
            ->orderByDesc('cnt')
            ->limit(5)
            ->get();

        return response()->json([
            'title' => 'Bimbingan Konseling',
            'metrics' => [
                ['label' => 'Siswa Aktif',      'value' => $totalSiswa,    'tone' => 'neutral'],
                ['label' => 'Kasus Aktif',      'value' => $kasusAktif,    'tone' => $kasusAktif > 10 ? 'warning' : 'neutral'],
                ['label' => 'Kasus Bulan Ini',  'value' => $kasusBulanIni, 'tone' => 'neutral'],
                ['label' => 'Guru BK + Wali',   'value' => $totalGuru,     'tone' => 'neutral'],
            ],
            'rows' => $kategoriRows->map(fn ($r) => [
                'label' => 'Kategori: '.($r->category ?? 'Lainnya'),
                'value' => $r->cnt,
            ])->all(),
        ]);
    }
}
