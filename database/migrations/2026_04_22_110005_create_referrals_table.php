<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('case_id')->nullable()->constrained('cases')->nullOnDelete();
            $table->foreignId('counselor_id')->constrained('users');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->string('referred_to');
            $table->text('reason');
            $table->date('date');
            $table->text('notes')->nullable();
            $table->enum('status', ['aktif', 'diterima', 'ditolak', 'selesai'])->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
