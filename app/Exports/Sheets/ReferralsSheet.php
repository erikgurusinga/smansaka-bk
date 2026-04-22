<?php

namespace App\Exports\Sheets;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReferralsSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(private Collection $referrals) {}

    public function title(): string
    {
        return 'Referral';
    }

    public function collection(): Collection
    {
        return $this->referrals;
    }

    public function headings(): array
    {
        return ['Tanggal', 'Siswa', 'Dirujuk Ke', 'Status'];
    }

    public function map($r): array
    {
        return [
            Carbon::parse($r->date)->format('Y-m-d'),
            $r->student->name ?? '—',
            $r->referred_to,
            ucfirst($r->status),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'color' => ['rgb' => '117481']]],
        ];
    }
}
