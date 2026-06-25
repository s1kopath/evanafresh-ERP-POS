<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'code', 'is_fractional', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_fractional' => 'boolean',
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

    /** Conversions where this unit is the source. */
    public function conversions(): HasMany
    {
        return $this->hasMany(UnitConversion::class, 'from_unit_id');
    }
}
