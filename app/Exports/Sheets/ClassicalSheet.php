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

class ClassicalSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(private Collection $records) {}

    public function title(): string
    {
        return 'Klasikal';
    }

    public function collection(): Collection
    {
        return $this->records;
    }

    public function headings(): array
    {
        return ['Tanggal', 'Kelas', 'Topik', 'Durasi (mnt)', 'Guru BK'];
    }

    public function map($c): array
    {
        return [
            Carbon::parse($c->date)->format('Y-m-d'),
            $c->school_class->name ?? '—',
            $c->topic,
            $c->duration_minutes ?? '—',
            $c->counselor->name ?? '—',
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
