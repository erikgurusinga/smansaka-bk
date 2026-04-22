<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SociometrySession extends Model
{
    protected $table = 'sociometry_sessions';

    protected $fillable = [
        'class_id', 'academic_year_id', 'counselor_id',
        'title', 'description', 'criteria', 'max_choices',
        'date', 'status',
    ];

    protected $casts = [
        'criteria' => 'array',
        'date' => 'date',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function choices(): HasMany
    {
        return $this->hasMany(SociometryChoice::class, 'session_id');
    }
}
