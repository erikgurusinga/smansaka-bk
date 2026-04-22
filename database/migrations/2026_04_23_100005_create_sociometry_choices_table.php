<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sociometry_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sociometry_sessions')->cascadeOnDelete();
            $table->foreignId('from_student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('to_student_id')->constrained('students')->cascadeOnDelete();
            $table->string('criterion_key');
            $table->enum('polarity', ['positive', 'negative'])->default('positive');
            $table->unsignedTinyInteger('rank')->default(1);
            $table->timestamps();
            $table->index(['session_id', 'criterion_key']);
            $table->index(['session_id', 'to_student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sociometry_choices');
    }
};
