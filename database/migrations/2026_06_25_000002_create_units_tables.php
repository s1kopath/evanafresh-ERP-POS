<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Units of measurement and explicit conversions between them (kg↔g, box↔pcs).
     * `is_fractional` flags weight/volume units that can carry decimal quantities.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');                 // Kilogram, Gram, Piece, Box, …
            $table->string('code');                 // kg, g, pcs, box
            $table->boolean('is_fractional')->default(false); // true → weight/volume (decimal qty)
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_unit_id')->constrained('units')->cascadeOnDelete();
            $table->foreignId('to_unit_id')->constrained('units')->cascadeOnDelete();
            $table->decimal('factor', 15, 6);       // 1 from_unit = factor × to_unit (e.g. 1 kg = 1000 g)
            $table->timestamps();

            $table->unique(['from_unit_id', 'to_unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_conversions');
        Schema::dropIfExists('units');
    }
};
