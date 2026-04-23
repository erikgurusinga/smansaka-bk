<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CaseConference extends Model implements HasMedia
{
    use InteractsWithMedia;

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

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('documentation')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('agreements')
            ->singleFile()
            ->acceptsMimeTypes(['application/pdf']);
    }
}
