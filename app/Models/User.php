<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'phone', 'password', 'company_id', 'branch_id', 'is_owner', 'is_active'])]
#[Hidden(['password', 'remember_token', 'pos_pin_hash'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ---- Relationships -----------------------------------------------------

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    // ---- RBAC helpers ------------------------------------------------------

    /**
     * Flat list of permission names this user holds. Owners hold everything.
     *
     * @return array<int, string>
     */
    public function permissionNames(): array
    {
        if ($this->is_owner) {
            return Permission::query()->pluck('name')->all();
        }

        return $this->roles
            ->loadMissing('permissions')
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->unique()
            ->values()
            ->all();
    }

    public function hasPermission(string $name): bool
    {
        return $this->is_owner || in_array($name, $this->permissionNames(), true);
    }

    public function hasRole(string $name): bool
    {
        return $this->roles->contains('name', $name);
    }

    public function roleName(): ?string
    {
        return $this->is_owner ? 'owner' : $this->roles->pluck('name')->first();
    }
}
