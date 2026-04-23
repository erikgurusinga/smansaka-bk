<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ClassicalGuidance extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $table = 'classical_guidance';

    protected $fillable = [
        'counselor_id', 'class_id', 'academic_year_id',
        'date', 'topic', 'description', 'method', 'evaluation', 'duration_minutes',
    ];

    protected $casts = [
        'date' => 'date',
        'duration_minutes' => 'integer',
    ];

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
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
