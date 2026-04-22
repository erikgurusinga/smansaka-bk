<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classical_guidance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counselor_id')->constrained('users');
            $table->foreignId('class_id')->constrained('classes');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->date('date');
            $table->string('topic');
            $table->text('description')->nullable();
            $table->string('method')->nullable();
            $table->text('evaluation')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classical_guidance');
    }
};
