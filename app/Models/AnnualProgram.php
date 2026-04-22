<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnnualProgram extends Model
{
    protected $table = 'annual_programs';

    protected $fillable = [
        'academic_year_id', 'counselor_id',
        'title', 'description', 'status',
        'generation_source', 'items',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function semesterPrograms(): HasMany
    {
        return $this->hasMany(SemesterProgram::class);
    }
}
