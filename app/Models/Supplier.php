<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Supplier extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id', 'name', 'contact_name', 'phone', 'email', 'address', 'trn',
        'opening_balance_minor', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
