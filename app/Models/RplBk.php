<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RplBk extends Model
{
    protected $table = 'rpl_bk';

    protected $fillable = [
        'counselor_id', 'academic_year_id',
        'title', 'bidang', 'service_type', 'class_level',
        'duration_minutes', 'objective', 'method', 'materials',
        'activities', 'evaluation', 'semester',
    ];

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
