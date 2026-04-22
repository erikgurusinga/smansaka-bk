<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseConference extends Model
{
    protected $fillable = [
        'case_id', 'counselor_id', 'academic_year_id',
        'date', 'topic', 'participants', 'notes', 'outcome', 'status',
    ];

    protected $casts = [
        'date' => 'date',
        'participants' => 'array',
    ];

    public function caseRecord(): BelongsTo
    {
        return $this->belongsTo(CaseRecord::class, 'case_id');
    }

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
