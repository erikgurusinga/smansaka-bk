<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instrument_dcm_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->foreignId('item_id')->constrained('instrument_dcm_items')->cascadeOnDelete();
            $table->boolean('checked')->default(false);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['student_id', 'academic_year_id', 'item_id'], 'dcm_response_unique');
            $table->index(['academic_year_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instrument_dcm_responses');
    }
};
