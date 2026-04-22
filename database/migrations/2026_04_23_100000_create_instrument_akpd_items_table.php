<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instrument_akpd_items', function (Blueprint $table) {
            $table->id();
            $table->enum('bidang', ['pribadi', 'sosial', 'belajar', 'karier']);
            $table->text('question');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['bidang', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instrument_akpd_items');
    }
};
