<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optional product photo. Stored as a path on the `public` disk
     * (e.g. products/ab12….webp); served via the storage symlink. Optimized
     * (resized + re-encoded) on upload by App\Support\ImageOptimizer.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('barcode');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
