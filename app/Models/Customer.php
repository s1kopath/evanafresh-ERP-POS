<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id', 'branch_id', 'name', 'phone', 'email', 'address',
        'credit_limit_minor', 'opening_balance_minor', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit_minor' => 'integer',
            'opening_balance_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
