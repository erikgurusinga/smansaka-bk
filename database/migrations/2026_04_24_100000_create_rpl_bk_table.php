<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rpl_bk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counselor_id')->constrained('users');
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->string('title');
            $table->enum('bidang', ['pribadi', 'sosial', 'belajar', 'karier']);
            $table->enum('service_type', ['klasikal', 'kelompok', 'individual', 'konsultasi'])->default('klasikal');
            $table->enum('class_level', ['X', 'XI', 'XII', 'semua'])->default('semua');
            $table->unsignedSmallInteger('duration_minutes')->default(90);
            $table->text('objective');
            $table->text('method')->nullable();
            $table->text('materials')->nullable();
            $table->text('activities')->nullable();
            $table->text('evaluation')->nullable();
            $table->enum('semester', ['ganjil', 'genap'])->default('ganjil');
            $table->timestamps();
            $table->index(['academic_year_id', 'bidang']);
            $table->index(['academic_year_id', 'semester']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rpl_bk');
    }
};
