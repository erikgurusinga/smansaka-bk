<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeVisit extends Model
{
    protected $fillable = [
        'student_id', 'counselor_id', 'academic_year_id',
        'date', 'purpose', 'findings', 'action_plan',
        'signature_student', 'signature_parent', 'signature_counselor',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // Exclude large signature fields from array output by default
    protected $hidden = ['signature_student', 'signature_parent', 'signature_counselor'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
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
