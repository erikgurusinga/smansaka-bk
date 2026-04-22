<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instrument_dcm_items', function (Blueprint $table) {
            $table->id();
            $table->string('topic');
            $table->unsignedTinyInteger('topic_order')->default(0);
            $table->text('question');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['topic_order', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instrument_dcm_items');
    }
};
