<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-branch overrides for a product: minimum stock level (reorder trigger) and
     * an optional price override. A null price_minor means "use the product's base
     * sell price". Rows are created only when a branch actually differs from default.
     */
    public function up(): void
    {
        Schema::create('product_branch', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->decimal('min_stock_level', 12, 3)->default(0);
            $table->unsignedBigInteger('price_minor')->nullable(); // null = inherit base sell price
            $table->boolean('is_active')->default(true);           // stock this product at this branch?
            $table->timestamps();

            $table->unique(['product_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_branch');
    }
};
