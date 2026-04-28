<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * HTTP client untuk smansaka-admin hub (data master).
 * Pakai Bearer token Sanctum. Otomatis loop semua halaman pagination.
 */
class HubClient
{
    public function __construct(
        protected string $url,
        protected string $token,
        protected int $timeout = 15,
    ) {
        if ($url === '' || $token === '') {
            throw new RuntimeException('HUB_URL atau HUB_TOKEN belum di-set di .env');
        }
    }

    public static function fromConfig(): self
    {
        return new self(
            url: (string) config('hub.url'),
            token: (string) config('hub.token'),
            timeout: (int) config('hub.timeout', 15),
        );
    }

    protected function request(): PendingRequest
    {
        return Http::baseUrl($this->url)
            ->timeout($this->timeout)
            ->withToken($this->token)
            ->acceptJson();
    }

    /**
     * Ambil semua siswa aktif dari hub (auto-paginate).
     *
     * @return array<int, array<string, mixed>>
     */
    public function siswas(array $params = []): array
    {
        return $this->paginated('/api/master/siswa', $params);
    }

    /**
     * Ambil semua guru aktif dari hub.
     *
     * @return array<int, array<string, mixed>>
     */
    public function gurus(): array
    {
        $r = $this->request()->get('/api/master/guru')->throw();

        return $r->json();
    }

    /**
     * Ambil semua pegawai aktif dari hub.
     *
     * @return array<int, array<string, mixed>>
     */
    public function pegawais(): array
    {
        $r = $this->request()->get('/api/master/pegawai')->throw();

        return $r->json();
    }

    /**
     * Ambil semua kelas tahun aktif dari hub.
     *
     * @return array<int, array<string, mixed>>
     */
    public function kelas(): array
    {
        $r = $this->request()->get('/api/master/kelas')->throw();

        return $r->json();
    }

    /**
     * Ambil semua tahun ajaran dari hub.
     *
     * @return array<int, array<string, mixed>>
     */
    public function tahunAjaran(): array
    {
        $r = $this->request()->get('/api/master/tahun-ajaran')->throw();

        return $r->json();
    }

    /**
     * Helper: GET endpoint paginated, loop sampai habis.
     */
    protected function paginated(string $path, array $params = []): array
    {
        $records = [];
        $page = 1;

        while (true) {
            $r = $this->request()->get($path, $params + ['page' => $page, 'per_page' => 100])->throw();
            $body = $r->json();

            $data = $body['data'] ?? [];
            if (! is_array($data) || count($data) === 0) {
                break;
            }

            foreach ($data as $row) {
                $records[] = $row;
            }

            $lastPage = $body['last_page'] ?? 1;
            if ($page >= $lastPage) {
                break;
            }
            $page++;
        }

        return $records;
    }
}
