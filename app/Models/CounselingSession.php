<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CounselingSession extends Model
{
    protected $fillable = [
        'type', 'counselor_id', 'academic_year_id',
        'date', 'start_time', 'duration_minutes',
        'topic', 'description', 'outcome', 'next_plan',
        'status', 'is_confidential',
    ];

    protected $casts = [
        'date' => 'date',
        'is_confidential' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(CounselingParticipant::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'counseling_participants');
    }
}
