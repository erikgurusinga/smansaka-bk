<?php

namespace App\Console\Commands;

use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

/**
 * Reset database demo ke kondisi bersih (data fiktif).
 *
 * Menjalankan migrate:fresh + DemoSeeder. Hanya boleh jalan saat DEMO_MODE
 * aktif agar tidak pernah menghapus database produksi secara tidak sengaja.
 * Dijadwalkan berkala di routes/console.php.
 */
class DemoResetCommand extends Command
{
    protected $signature = 'demo:reset {--force : Lewati konfirmasi (untuk cron)}';

    protected $description = 'Reset database demo ke data fiktif bersih (hanya saat DEMO_MODE aktif)';

    public function handle(): int
    {
        if (! config('demo.enabled')) {
            $this->error('DEMO_MODE tidak aktif. Reset dibatalkan demi keamanan data produksi.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm('Hapus & isi ulang database demo ('.config('database.connections.'.config('database.default').'.database').') dengan data fiktif?')) {
            $this->info('Dibatalkan.');

            return self::SUCCESS;
        }

        $this->info('Mereset database demo…');

        Artisan::call('migrate:fresh', [
            '--seed' => true,
            '--seeder' => DemoSeeder::class,
            '--force' => true,
        ], $this->output);

        $this->newLine();
        $this->info('✓ Database demo berhasil direset '.now()->format('d/m/Y H:i'));

        return self::SUCCESS;
    }
}
