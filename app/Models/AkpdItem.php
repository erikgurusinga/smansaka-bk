<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AkpdItem extends Model
{
    protected $table = 'instrument_akpd_items';

    protected $fillable = ['bidang', 'question', 'sort_order', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function responses(): HasMany
    {
        return $this->hasMany(AkpdResponse::class, 'item_id');
    }
}
