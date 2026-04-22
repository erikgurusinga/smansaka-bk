<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DcmItem extends Model
{
    protected $table = 'instrument_dcm_items';

    protected $fillable = ['topic', 'topic_order', 'question', 'sort_order', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function responses(): HasMany
    {
        return $this->hasMany(DcmResponse::class, 'item_id');
    }
}
