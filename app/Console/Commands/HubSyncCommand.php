<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\HubClient;
use Illuminate\Console\Command;
use Throwable;

class HubSyncCommand extends Command
{
    protected $signature = 'hub:sync
        {--only= : Subset entitas yang di-sync: tahun, kelas, guru, siswa (pisah koma). Default: semua.}';

    protected $description = 'Sync data master dari smansaka-admin hub ke database lokal BK.';

    public function handle(): int
    {
        $only = collect(explode(',', (string) $this->option('only')))
            ->map(fn ($s) => trim($s))->filter()->all();

        $shouldRun = fn (string $key) => empty($only) || in_array($key, $only, true);

        try {
            $hub = HubClient::fromConfig();

            if ($shouldRun('tahun')) {
                $this->syncTahunAjaran($hub);
            }
            if ($shouldRun('kelas')) {
                $this->syncKelas($hub);
            }
            if ($shouldRun('guru')) {
                $this->syncGuru($hub);
            }
            if ($shouldRun('siswa')) {
                $this->syncSiswa($hub);
            }
        } catch (Throwable $e) {
            $this->error('Sync gagal: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Sync selesai.');

        return self::SUCCESS;
    }

    protected function syncTahunAjaran(HubClient $hub): void
    {
        $this->line('Sync tahun ajaran...');
        $rows = $hub->tahunAjaran();
        $count = 0;

        // BK schema: kolom `year` UNIQUE (1 row per tahun ajaran, tanpa duplikasi per semester).
        // Hub schema: 1 row per (tahun, semester). Kita hanya sync yang AKTIF — itu yang relevan untuk BK.
        // Plus tahun yang tidak aktif di BK kalau belum ada (untuk arsip), dengan ranking aktif menang terakhir.
        usort($rows, fn ($a, $b) => ($a['is_aktif'] ?? false) <=> ($b['is_aktif'] ?? false));

        foreach ($rows as $row) {
            AcademicYear::updateOrCreate(
                ['year' => $row['nama']],
                [
                    'start_date' => $row['tanggal_mulai'] ?? now()->startOfYear()->toDateString(),
                    'end_date' => $row['tanggal_selesai'] ?? now()->endOfYear()->toDateString(),
                    'semester' => $row['semester'] ?? 'ganjil',
                    'is_active' => (bool) ($row['is_aktif'] ?? false),
                    'is_closed' => false,
                ]
            );
            $count++;
        }
        $this->info("  ✓ Tahun ajaran: {$count} record diproses (aktif menang terakhir)");
    }

    protected function syncKelas(HubClient $hub): void
    {
        $this->line('Sync kelas...');
        $rows = $hub->kelas();

        // Cache active academic year (BK only stores 1 active)
        $activeYearId = AcademicYear::where('is_active', true)->value('id');
        if (! $activeYearId) {
            $this->warn('  ! Tidak ada academic_year aktif di BK. Jalankan --only=tahun dulu.');

            return;
        }

        $count = 0;
        foreach ($rows as $row) {
            SchoolClass::updateOrCreate(
                [
                    'name' => $row['nama_kelas'],
                    'academic_year_id' => $activeYearId,
                ],
                [
                    'level' => $row['tingkat'],
                    'homeroom_teacher_id' => null, // di-set manual via UI BK
                ]
            );
            $count++;
        }
        $this->info("  ✓ Kelas: {$count} record");
    }

    protected function syncGuru(HubClient $hub): void
    {
        $this->line('Sync guru...');
        $rows = $hub->gurus();
        $count = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            // Tanpa NIP, tidak ada natural key untuk upsert — skip
            if (empty($row['nip'])) {
                $skipped++;

                continue;
            }

            Teacher::updateOrCreate(
                ['nip' => $row['nip']],
                [
                    'name' => $row['nama'],
                    'phone' => $row['no_telp'] ?? null,
                    'email' => $row['email'] ?? null,
                    'is_bk' => str_contains(strtolower((string) ($row['bidang_studi'] ?? '')), 'bimbingan'),
                    // user_id sengaja tidak di-sync — beda sistem auth
                ]
            );
            $count++;
        }
        $this->info("  ✓ Guru: {$count} record".($skipped > 0 ? " ({$skipped} skip karena NIP kosong)" : ''));
    }

    protected function syncSiswa(HubClient $hub): void
    {
        $this->line('Sync siswa (paginated, mungkin lambat)...');
        $rows = $hub->siswas();

        // Build lookup: hub_kelas_id → bk_class_id (via natural key nama_kelas)
        $hubKelas = collect($hub->kelas())->keyBy('id');
        $bkClasses = SchoolClass::pluck('id', 'name');

        $count = 0;
        $orphan = 0;

        foreach ($rows as $row) {
            $bkClassId = null;
            if (! empty($row['kelas_id'])) {
                $hubKelasNama = $hubKelas[$row['kelas_id']]['nama_kelas'] ?? null;
                $bkClassId = $hubKelasNama ? ($bkClasses[$hubKelasNama] ?? null) : null;
            }

            if ($bkClassId === null) {
                $orphan++;
            }

            Student::updateOrCreate(
                ['nis' => $row['nis']],
                [
                    'nisn' => $row['nisn'] ?? null,
                    'name' => $row['nama'],
                    'gender' => $row['jenis_kelamin'],
                    'birth_place' => $row['tempat_lahir'] ?? null,
                    'birth_date' => $row['tanggal_lahir'] ?? null,
                    'address' => $row['alamat'] ?? null,
                    'phone' => $row['no_telp'] ?? null,
                    'religion' => $row['agama'] ?? null,
                    'class_id' => $bkClassId,
                    'status' => $this->mapStatus($row['status'] ?? 'aktif'),
                ]
            );
            $count++;
        }

        $this->info("  ✓ Siswa: {$count} record".($orphan > 0 ? " ({$orphan} tanpa kelas — class_id null)" : ''));
    }

    protected function mapStatus(string $hubStatus): string
    {
        // Hub: aktif|alumni|pindah|keluar  →  BK: aktif|lulus|keluar|pindah
        return match ($hubStatus) {
            'alumni' => 'lulus',
            'pindah' => 'pindah',
            'keluar' => 'keluar',
            default => 'aktif',
        };
    }
}
