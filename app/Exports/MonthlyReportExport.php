<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class MonthlyReportExport implements WithMultipleSheets
{
    use Exportable;

    public function __construct(
        private array $summary,
        private array $details,
        private Carbon $start,
        private Carbon $end,
        private string $periodLabel,
    ) {}

    public function sheets(): array
    {
        return [
            new Sheets\SummarySheet($this->summary, $this->periodLabel),
            new Sheets\CasesSheet($this->details['cases']),
            new Sheets\CounselingSheet($this->details['counseling']),
            new Sheets\ClassicalSheet($this->details['classical']),
            new Sheets\HomeVisitsSheet($this->details['home_visits']),
            new Sheets\ViolationsSheet($this->details['violations']),
            new Sheets\ReferralsSheet($this->details['referrals']),
        ];
    }
}
