<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SemesterProgram extends Model
{
    protected $table = 'semester_programs';

    protected $fillable = [
        'annual_program_id', 'semester',
        'title', 'notes', 'schedule',
    ];

    protected $casts = [
        'schedule' => 'array',
    ];

    public function annualProgram(): BelongsTo
    {
        return $this->belongsTo(AnnualProgram::class);
    }
}
