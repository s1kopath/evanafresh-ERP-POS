<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePayment extends Model
{
    public $timestamps = false;

    protected $fillable = ['sale_id', 'method', 'amount_minor', 'reference'];

    protected function casts(): array
    {
        return ['amount_minor' => 'integer'];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
