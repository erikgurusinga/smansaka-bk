<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_conferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->nullable()->constrained('cases')->nullOnDelete();
            $table->foreignId('counselor_id')->constrained('users');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->date('date');
            $table->string('topic');
            $table->json('participants')->nullable();
            $table->text('notes')->nullable();
            $table->text('outcome')->nullable();
            $table->enum('status', ['dijadwalkan', 'selesai'])->default('dijadwalkan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_conferences');
    }
};
