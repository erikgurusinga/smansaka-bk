<?php

namespace App\Services;

use Mpdf\Mpdf;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;

class PdfService
{
    /**
     * Konfigurasi default kertas A4, margin standar surat dinas,
     * header 1 cm, footer 1 cm.
     *
     * Satuan: mm
     *   margin_top/bottom/left/right = area konten
     *   margin_header / margin_footer = tinggi zona header & footer
     */
    public static function defaultConfig(array $override = []): array
    {
        return array_merge([
            'format'          => 'A4',          // 210 × 297 mm
            'margin_top'      => 30,             // 3 cm — ruang konten dari atas (di bawah header)
            'margin_bottom'   => 25,             // 2.5 cm — ruang konten dari bawah (di atas footer)
            'margin_left'     => 35,             // 3.5 cm — margin kiri (binding)
            'margin_right'    => 25,             // 2.5 cm — margin kanan
            'margin_header'   => 10,             // 1 cm — tinggi area header
            'margin_footer'   => 10,             // 1 cm — tinggi area footer
            'default_font'    => 'dejavusans',   // font Unicode default mPDF
            'default_font_size' => 11,
            'tempDir'         => storage_path('app/mpdf-tmp'),
        ], $override);
    }

    /**
     * Buat instance Mpdf siap pakai.
     *
     * @param  array  $config  Override config (lihat defaultConfig)
     * @param  string $header  HTML untuk header halaman (kosong = tidak ada header)
     * @param  string $footer  HTML untuk footer halaman (kosong = tidak ada footer)
     */
    public static function make(
        array  $config = [],
        string $header = '',
        string $footer = ''
    ): Mpdf {
        $cfg = self::defaultConfig($config);

        self::ensureTempDir($cfg['tempDir']);

        $mpdf = new Mpdf($cfg);
        $mpdf->SetTitle(config('app.name'));
        $mpdf->SetAuthor(config('app.name'));
        $mpdf->SetCreator('mPDF');

        if ($header !== '') {
            $mpdf->SetHTMLHeader($header);
        }

        if ($footer !== '') {
            $mpdf->SetHTMLFooter($footer);
        }

        return $mpdf;
    }

    /**
     * Render Blade view ke PDF dan kirim sebagai response download.
     *
     * @param  string  $view      Nama Blade view
     * @param  array   $data      Data ke view
     * @param  string  $filename  Nama file PDF (tanpa .pdf)
     * @param  string  $header    HTML header halaman
     * @param  string  $footer    HTML footer halaman
     * @param  array   $config    Override config mPDF
     */
    public static function download(
        string $view,
        array  $data = [],
        string $filename = 'dokumen',
        string $header = '',
        string $footer = '',
        array  $config = []
    ): \Symfony\Component\HttpFoundation\Response {
        $html = view($view, $data)->render();
        $mpdf = self::make($config, $header, $footer);
        $mpdf->WriteHTML($html);

        return response()->streamDownload(
            fn () => print($mpdf->Output('', 'S')),
            $filename . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Render Blade view ke PDF dan tampilkan inline di browser.
     */
    public static function inline(
        string $view,
        array  $data = [],
        string $filename = 'dokumen',
        string $header = '',
        string $footer = '',
        array  $config = []
    ): \Symfony\Component\HttpFoundation\Response {
        $html = view($view, $data)->render();
        $mpdf = self::make($config, $header, $footer);
        $mpdf->WriteHTML($html);

        return response($mpdf->Output('', 'S'), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '.pdf"',
        ]);
    }

    private static function ensureTempDir(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
}
