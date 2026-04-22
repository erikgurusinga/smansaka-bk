<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semester_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('annual_program_id')->constrained('annual_programs')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->string('title');
            $table->text('notes')->nullable();
            $table->json('schedule');
            $table->timestamps();
            $table->unique(['annual_program_id', 'semester'], 'semester_program_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semester_programs');
    }
};
