<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Student extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'nis', 'nisn', 'name', 'gender', 'birth_place', 'birth_date',
        'address', 'phone', 'religion', 'class_id', 'status',
    ];

    protected $casts = ['birth_date' => 'date'];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photo')->singleFile();
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'student_parents', 'student_id', 'parent_id');
    }

    public function guidanceTeachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_guidance', 'student_id', 'user_id')
            ->withPivot('academic_year_id');
    }

    public function akpdResponses(): HasMany
    {
        return $this->hasMany(AkpdResponse::class);
    }

    public function dcmResponses(): HasMany
    {
        return $this->hasMany(DcmResponse::class);
    }

    public function careerAssessments(): HasMany
    {
        return $this->hasMany(CareerAssessment::class);
    }
}
