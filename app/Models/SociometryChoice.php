<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SociometryChoice extends Model
{
    protected $table = 'sociometry_choices';

    protected $fillable = [
        'session_id', 'from_student_id', 'to_student_id',
        'criterion_key', 'polarity', 'rank',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(SociometrySession::class, 'session_id');
    }

    public function fromStudent(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'from_student_id');
    }

    public function toStudent(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'to_student_id');
    }
}
