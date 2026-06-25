<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id', 'category_id', 'unit_id', 'tax_rate_id',
        'name', 'sku', 'barcode', 'image_path',
        'cost_price_minor', 'sell_price_minor',
        'is_weight_based', 'reorder_level', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'cost_price_minor' => 'integer',
            'sell_price_minor' => 'integer',
            'is_weight_based' => 'boolean',
            'reorder_level' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Root-relative URL for the product photo, or null when none is set. Relative
     * (not Storage::url(), which prefixes APP_URL) so it resolves against whatever
     * host/port the app is served from — dev (127.0.0.1:8000) and prod alike.
     * Missing/invalid files are handled on the client (<ProductImage> falls back
     * to a placeholder), so we don't stat the disk on every read.
     */
    public function imageUrl(): ?string
    {
        return $this->image_path ? '/storage/'.ltrim($this->image_path, '/') : null;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class);
    }

    /** Per-branch min levels and price overrides. */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'product_branch')
            ->withPivot(['min_stock_level', 'price_minor', 'is_active'])
            ->withTimestamps();
    }
}
