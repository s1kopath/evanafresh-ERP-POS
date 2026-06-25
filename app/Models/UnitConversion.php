<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitConversion extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = ['company_id', 'from_unit_id', 'to_unit_id', 'factor'];

    protected function casts(): array
    {
        return ['factor' => 'decimal:6'];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function fromUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }

    public function toUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'to_unit_id');
    }
}
