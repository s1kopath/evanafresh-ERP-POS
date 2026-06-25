<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Server-side record of sales. The client-stable `uuid` is the idempotency key:
     * a sale pushed twice (lost ack, retry) is recorded exactly once.
     * Money is stored as integer minor units (halalas; 1 SAR = 100).
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();                 // generated on the device — idempotency key
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('terminal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('pos_devices')->nullOnDelete();
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('number');                       // per-terminal document number (offline-safe)
            $table->string('status')->default('synced');
            $table->unsignedBigInteger('subtotal_minor')->default(0);
            $table->unsignedBigInteger('vat_minor')->default(0);
            $table->unsignedBigInteger('total_minor')->default(0);
            $table->timestamp('sold_at')->nullable();       // when the sale happened on the device
            $table->timestamp('synced_at')->nullable();     // when HQ received it
            $table->timestamps();

            $table->index(['branch_id', 'sold_at']);
        });

        Schema::create('sale_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('barcode')->nullable();
            $table->decimal('qty', 12, 3)->default(1);
            $table->unsignedBigInteger('unit_price_minor')->default(0);
            $table->unsignedBigInteger('line_total_minor')->default(0);
        });

        Schema::create('sale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('method');                       // cash | card | credit
            $table->unsignedBigInteger('amount_minor')->default(0);
            $table->string('reference')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_lines');
        Schema::dropIfExists('sales');
    }
};
