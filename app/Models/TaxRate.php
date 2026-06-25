<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaxRate extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'rate', 'is_default', 'is_active'];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
