<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * VAT / tax rates. Saudi standard VAT is 15%. One rate is flagged default and
     * applied to new products unless overridden.
     */
    public function up(): void
    {
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');                 // Standard VAT, Zero-rated, Exempt
            $table->decimal('rate', 5, 2)->default(0); // percentage, e.g. 15.00
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rates');
    }
};
