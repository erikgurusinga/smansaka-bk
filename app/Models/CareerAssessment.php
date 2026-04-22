<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CareerAssessment extends Model
{
    protected $table = 'career_assessments';

    protected $fillable = [
        'student_id', 'academic_year_id',
        'scores', 'dominant_codes', 'recommendations', 'notes',
        'completed_at',
    ];

    protected $casts = [
        'scores' => 'array',
        'completed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
