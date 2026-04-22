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

class HomeVisitsSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(private Collection $visits) {}

    public function title(): string
    {
        return 'Home Visit';
    }

    public function collection(): Collection
    {
        return $this->visits;
    }

    public function headings(): array
    {
        return ['Tanggal', 'Siswa', 'Tujuan', 'Status'];
    }

    public function map($v): array
    {
        return [
            Carbon::parse($v->date)->format('Y-m-d'),
            $v->student->name ?? '—',
            $v->purpose,
            ucfirst($v->status),
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
