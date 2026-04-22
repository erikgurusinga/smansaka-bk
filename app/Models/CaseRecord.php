<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class CaseRecord extends Model
{
    use LogsActivity;

    protected $table = 'cases';

    protected $fillable = [
        'student_id', 'reported_by', 'academic_year_id',
        'category', 'title', 'description',
        'status', 'is_confidential', 'visible_to', 'resolved_at',
    ];

    protected $casts = [
        'is_confidential' => 'boolean',
        'visible_to' => 'array',
        'resolved_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'is_confidential'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function scopeVisibleTo(mixed $query, User $user): mixed
    {
        if ($user->isSuperAdmin() || in_array('koordinator_bk', $user->groupSlugs())) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            $q->where('reported_by', $user->id)
                ->orWhere('is_confidential', false)
                ->orWhereJsonContains('visible_to', $user->id);
        });
    }
}
