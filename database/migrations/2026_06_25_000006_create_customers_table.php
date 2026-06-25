<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Credit customers (company-wide). Money is integer minor units (halalas).
     * opening_balance_minor is signed: positive = customer owes us (receivable).
     * Ledger entries (Phase 6) post the opening balance into the customer ledger.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete(); // registered at
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->unsignedBigInteger('credit_limit_minor')->default(0);
            $table->bigInteger('opening_balance_minor')->default(0); // signed
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
