<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Guardian extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $table = 'parents';

    protected $fillable = ['name', 'relation', 'phone', 'email', 'occupation', 'address'];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photo')->singleFile();
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_parents', 'parent_id', 'student_id');
    }
}
