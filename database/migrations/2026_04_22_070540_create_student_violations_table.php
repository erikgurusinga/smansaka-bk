<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('violation_id')->constrained('violations');
            $table->foreignId('reported_by')->constrained('users');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->date('date');
            $table->text('description')->nullable();          // kronologi kejadian
            $table->enum('status', ['baru', 'diproses', 'selesai'])->default('baru');
            $table->enum('sp_level', ['SP1', 'SP2', 'SP3'])->nullable();
            $table->text('notes')->nullable();                // catatan penanganan
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_violations');
    }
};
