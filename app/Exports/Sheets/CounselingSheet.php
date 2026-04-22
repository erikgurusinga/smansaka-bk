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

class CounselingSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(private Collection $sessions) {}

    public function title(): string
    {
        return 'Konseling';
    }

    public function collection(): Collection
    {
        return $this->sessions;
    }

    public function headings(): array
    {
        return ['Tanggal', 'Jenis', 'Topik', 'Konselor', 'Status'];
    }

    public function map($s): array
    {
        return [
            Carbon::parse($s->date)->format('Y-m-d'),
            ucfirst($s->type),
            $s->topic,
            $s->counselor->name ?? '—',
            ucfirst($s->status),
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
