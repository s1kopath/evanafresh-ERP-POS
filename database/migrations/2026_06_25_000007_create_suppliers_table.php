<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suppliers / vendors (company-wide). opening_balance_minor is signed:
     * positive = we owe the supplier (payable). Posted into the supplier ledger
     * in Phase 6.
     */
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('trn')->nullable(); // supplier VAT number
            $table->bigInteger('opening_balance_minor')->default(0); // signed
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
