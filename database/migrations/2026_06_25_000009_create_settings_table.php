<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Key-value company settings (store header, VAT/TRN, alert thresholds). Flexible
     * by design so later phases can add keys without a schema change.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
