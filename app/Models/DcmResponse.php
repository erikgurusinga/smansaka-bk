<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DcmResponse extends Model
{
    protected $table = 'instrument_dcm_responses';

    protected $fillable = ['student_id', 'academic_year_id', 'item_id', 'checked', 'submitted_at'];

    protected $casts = [
        'checked' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(DcmItem::class, 'item_id');
    }
}
