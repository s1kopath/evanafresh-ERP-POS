<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The shared product catalogue (company-wide). Money is stored as integer minor
     * units (halalas; 1 SAR = 100). Per-branch min levels and price overrides live in
     * `product_branch`. Stock itself is tracked in Phase 3 (stock_movements/levels).
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tax_rate_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->unsignedBigInteger('cost_price_minor')->default(0);
            $table->unsignedBigInteger('sell_price_minor')->default(0);
            $table->boolean('is_weight_based')->default(false); // sold by weight (price per kg)
            $table->decimal('reorder_level', 12, 3)->default(0); // default min stock; per-branch override in pivot
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // NULLs are distinct on both SQLite and MySQL, so products without a
            // barcode/sku don't collide.
            $table->unique(['company_id', 'barcode']);
            $table->unique(['company_id', 'sku']);
            $table->index(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
