<?php

namespace App\Imports;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class StudentsImport implements ToCollection, WithHeadingRow, WithValidation
{
    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            $classId = null;
            if (! empty($row['kelas'])) {
                $class = SchoolClass::where('name', 'like', "%{$row['kelas']}%")
                    ->whereHas('academicYear', fn ($q) => $q->where('is_active', true))
                    ->first();
                $classId = $class?->id;
            }

            Student::updateOrCreate(
                ['nis' => (string) $row['nis']],
                [
                    'nisn' => isset($row['nisn']) ? (string) $row['nisn'] : null,
                    'name' => $row['nama'],
                    'gender' => strtoupper($row['jk'] ?? 'L') === 'P' ? 'P' : 'L',
                    'birth_place' => $row['tempat_lahir'] ?? null,
                    'birth_date' => isset($row['tanggal_lahir'])
                        ? Date::excelToDateTimeObject($row['tanggal_lahir'])->format('Y-m-d')
                        : null,
                    'address' => $row['alamat'] ?? null,
                    'phone' => isset($row['telepon']) ? (string) $row['telepon'] : null,
                    'religion' => $row['agama'] ?? null,
                    'class_id' => $classId,
                    'status' => 'aktif',
                ],
            );
        }
    }

    public function rules(): array
    {
        return [
            '*.nis' => 'required',
            '*.nama' => 'required|string',
        ];
    }
}
