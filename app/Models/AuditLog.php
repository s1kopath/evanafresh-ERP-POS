<?php

namespace App\Models;

use App\Support\CurrentBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public const UPDATED_AT = null; // append-only: created_at only

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Record an audit entry. Pass a model for data events, or use $extra
     * for non-model events (login, logout, branch.switch).
     */
    public static function record(string $event, ?Model $model = null, array $extra = []): self
    {
        $user = auth()->user();

        return static::create([
            'user_id' => $user?->id,
            'branch_id' => app(CurrentBranch::class)->id() ?? $user?->branch_id,
            'event' => $event,
            'auditable_type' => $model ? $model::class : ($extra['auditable_type'] ?? null),
            'auditable_id' => $model?->getKey() ?? ($extra['auditable_id'] ?? null),
            'old_values' => $extra['old_values'] ?? null,
            'new_values' => $extra['new_values'] ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
