<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Nullable foreign keys (no DB-level constraint on the ALTER for SQLite portability).
            $table->unsignedBigInteger('company_id')->nullable()->after('id');
            $table->unsignedBigInteger('branch_id')->nullable()->after('company_id');
            $table->string('phone')->nullable()->after('email');
            $table->boolean('is_owner')->default(false)->after('password');
            $table->boolean('is_active')->default(true)->after('is_owner');
            $table->string('pos_pin_hash')->nullable()->after('is_active'); // offline POS terminal login

            $table->index('company_id');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['company_id']);
            $table->dropIndex(['branch_id']);
            $table->dropColumn(['company_id', 'branch_id', 'phone', 'is_owner', 'is_active', 'pos_pin_hash']);
        });
    }
};
