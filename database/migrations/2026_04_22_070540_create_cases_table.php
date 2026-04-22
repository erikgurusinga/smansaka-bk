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
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('reported_by')->constrained('users');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->enum('category', ['akademik', 'pribadi', 'sosial', 'karier', 'pelanggaran']);
            $table->string('title');
            $table->text('description');
            $table->enum('status', ['baru', 'penanganan', 'selesai', 'rujukan'])->default('baru');
            $table->boolean('is_confidential')->default(true);
            $table->json('visible_to')->nullable();   // array user_id yang bisa lihat
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
