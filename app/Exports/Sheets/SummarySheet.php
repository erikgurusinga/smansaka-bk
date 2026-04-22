<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SummarySheet implements FromArray, WithStyles, WithTitle
{
    public function __construct(private array $summary, private string $periodLabel) {}

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function array(): array
    {
        $s = $this->summary;

        return [
            ['SMA Negeri 1 Kabanjahe — Layanan BK'],
            ['Laporan '.$this->periodLabel],
            [],
            ['Ringkasan Utama'],
            ['Kasus Baru', $s['cases_total']],
            ['Kasus Selesai', $s['cases_resolved']],
            ['Pelanggaran Tercatat', $s['violations_total']],
            ['Referral', $s['referrals']],
            [],
            ['Kategori Kasus'],
            ['Akademik', $s['cases_by_category']['akademik']],
            ['Pribadi', $s['cases_by_category']['pribadi']],
            ['Sosial', $s['cases_by_category']['sosial']],
            ['Karier', $s['cases_by_category']['karier']],
            ['Pelanggaran', $s['cases_by_category']['pelanggaran']],
            [],
            ['Layanan Konseling'],
            ['Konseling Individual', $s['counseling_individual']],
            ['Konseling Kelompok', $s['counseling_group']],
            ['Bimbingan Klasikal', $s['classical']],
            ['Home Visit', $s['home_visits']],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '117481']]],
            2 => ['font' => ['italic' => true, 'color' => ['rgb' => '555555']]],
            4 => ['font' => ['bold' => true]],
            10 => ['font' => ['bold' => true]],
            17 => ['font' => ['bold' => true]],
        ];
    }
}
