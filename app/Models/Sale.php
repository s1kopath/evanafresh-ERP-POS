<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use Auditable;

    protected $fillable = [
        'uuid', 'branch_id', 'terminal_id', 'device_id', 'cashier_id',
        'number', 'status', 'subtotal_minor', 'vat_minor', 'total_minor',
        'sold_at', 'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'sold_at' => 'datetime',
            'synced_at' => 'datetime',
            'subtotal_minor' => 'integer',
            'vat_minor' => 'integer',
            'total_minor' => 'integer',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SaleLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }
}
