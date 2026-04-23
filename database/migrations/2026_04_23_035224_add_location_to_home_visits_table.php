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
        Schema::table('home_visits', function (Blueprint $table) {
            $table->string('location')->nullable()->after('date');
            $table->string('address')->nullable()->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('home_visits', function (Blueprint $table) {
            $table->dropColumn(['location', 'address']);
        });
    }
};
