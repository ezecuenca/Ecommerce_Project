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
        // Use Schema::table() to modify an existing table
        Schema::table('chatbox', function (Blueprint $table) {
            // Add the new 'image' column
            // Typically stores a path or URL to the image file
            // Make it nullable since not all messages will have an image
            $table->string('image')->nullable()->after('message_text'); // Adds the column after 'message_text'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Define how to reverse the change (remove the column)
        Schema::table('chatbox', function (Blueprint $table) {
            $table->dropColumn('image');
        });
    }
};