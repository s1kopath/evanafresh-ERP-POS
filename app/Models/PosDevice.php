<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosDevice extends Model
{
    protected $fillable = [
        'branch_id', 'terminal_id', 'name', 'device_uid', 'token_hash',
        'status', 'enrolled_by', 'enrolled_at', 'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function terminal(): BelongsTo
    {
        return $this->belongsTo(Terminal::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
