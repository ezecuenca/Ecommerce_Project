<?php

// database/migrations/YYYY_MM_DD_HHMMSS_create_simplified_password_resets_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simplified_password_resets', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token')->unique();
            $table->timestamp('created_at')->nullable();
            // VVVVVV CHANGE VVVVVV
            $table->timestamp('expires_at')->nullable(); // Make it nullable
            // ^^^^^^ CHANGE ^^^^^^
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simplified_password_resets');
    }
};