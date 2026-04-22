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

class CasesSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(private Collection $cases) {}

    public function title(): string
    {
        return 'Kasus';
    }

    public function collection(): Collection
    {
        return $this->cases;
    }

    public function headings(): array
    {
        return ['Tanggal', 'Judul Kasus', 'Siswa', 'Kategori', 'Status'];
    }

    public function map($c): array
    {
        return [
            Carbon::parse($c->created_at)->format('Y-m-d'),
            $c->title,
            $c->student->name ?? '—',
            ucfirst($c->category),
            ucfirst($c->status),
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
