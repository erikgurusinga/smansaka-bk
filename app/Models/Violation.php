<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Violation extends Model
{
    protected $fillable = ['name', 'category', 'points', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean', 'points' => 'integer'];

    public function studentViolations(): HasMany
    {
        return $this->hasMany(StudentViolation::class);
    }
}
