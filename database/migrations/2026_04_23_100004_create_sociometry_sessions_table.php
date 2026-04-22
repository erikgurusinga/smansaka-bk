<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sociometry_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->foreignId('counselor_id')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('criteria');
            $table->unsignedTinyInteger('max_choices')->default(3);
            $table->date('date');
            $table->enum('status', ['draft', 'open', 'closed'])->default('draft');
            $table->timestamps();
            $table->index(['class_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sociometry_sessions');
    }
};
