<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, LogsActivity, Notifiable, SoftDeletes;

    protected $fillable = [
        'username',
        'name',
        'email',
        'password',
        'photo',
        'position',
        'phone',
        'groups',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'groups' => 'array',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['username', 'name', 'email', 'position', 'groups', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * Nama (grup) tempat user menjadi anggota.
     *
     * @return array<int, string>
     */
    public function groupSlugs(): array
    {
        $ids = $this->groups ?? [];
        if (empty($ids)) {
            return [];
        }

        return UserGroup::whereIn('id', $ids)->pluck('slug')->toArray();
    }

    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->id === 1;
    }

    /**
     * Cek apakah user punya akses ke modul dengan ability tertentu.
     */
    public function hasModuleAccess(string $moduleSlug, string $ability = 'read'): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $perms = $this->getPermissionsMap();
        $modulePerms = $perms[$moduleSlug] ?? null;
        if (! $modulePerms) {
            return false;
        }

        return match ($ability) {
            'read' => (bool) ($modulePerms['read'] ?? false),
            'write' => (bool) ($modulePerms['write'] ?? false),
            default => false,
        };
    }

    /**
     * Dapatkan peta izin modul → ['read' => bool, 'write' => bool].
     *
     * @return array<string, array{read: bool, write: bool}>
     */
    public function getPermissionsMap(): array
    {
        return Cache::remember(
            "user.{$this->id}.permissions",
            now()->addMinutes(15),
            function () {
                $ids = $this->groups ?? [];
                if (empty($ids)) {
                    return [];
                }

                $rows = GroupAccess::with('module')
                    ->whereIn('group_id', $ids)
                    ->get();

                $map = [];
                foreach ($rows as $row) {
                    $slug = $row->module?->slug;
                    if (! $slug) {
                        continue;
                    }
                    // Merge: jika salah satu grup punya akses, user punya akses
                    $map[$slug]['read'] = ($map[$slug]['read'] ?? false) || $row->can_read;
                    $map[$slug]['write'] = ($map[$slug]['write'] ?? false) || $row->can_write;
                }

                return $map;
            }
        );
    }

    public function clearPermissionsCache(): void
    {
        Cache::forget("user.{$this->id}.permissions");
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::get(function () {
            if (! $this->photo) {
                return null;
            }

            return asset('storage/'.$this->photo);
        });
    }
}
