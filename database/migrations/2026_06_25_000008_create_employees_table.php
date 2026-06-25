<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Staff records (company-wide, assigned to a branch). Feeds payroll in Phase 7.
     * salary_minor is the monthly base salary in integer minor units (halalas).
     */
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('employee_no')->nullable();
            $table->string('position')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->unsignedBigInteger('salary_minor')->default(0);
            $table->date('joined_on')->nullable();
            $table->string('status')->default('active'); // active | on_leave | terminated
            $table->timestamps();

            $table->unique(['company_id', 'employee_no']);
            $table->index(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
