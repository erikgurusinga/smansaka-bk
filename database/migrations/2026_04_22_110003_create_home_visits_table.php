<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('counselor_id')->constrained('users');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->date('date');
            $table->text('purpose');
            $table->text('findings')->nullable();
            $table->text('action_plan')->nullable();
            $table->mediumText('signature_student')->nullable();
            $table->mediumText('signature_parent')->nullable();
            $table->mediumText('signature_counselor')->nullable();
            $table->enum('status', ['dijadwalkan', 'selesai'])->default('dijadwalkan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_visits');
    }
};
