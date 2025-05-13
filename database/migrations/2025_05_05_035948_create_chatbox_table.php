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
        Schema::create('chatbox', function (Blueprint $table) {
            $table->id(); // 'id integer [primary key]' - Auto-incrementing Big Integer
            $table->unsignedBigInteger('profile_id'); // 'profile_id integer' - Assuming profile.id is unsigned big integer
            $table->string('sender_type'); // 'sender_type varchar' - Default length 255
            $table->text('message_text'); // 'message_text text'
            $table->boolean('is_read')->default(false); // 'is_read boolean [default: false]'
            $table->timestamps(); // Handles 'created_at' and 'updated_at' timestamps automatically

            // Define the foreign key constraint
            // Assumes your profiles table is named 'profiles' and its primary key is 'id'
            // Adjust 'profiles' if your table name is different (e.g., 'profile')
            $table->foreign('profile_id')
                  ->references('id')
                  ->on('profiles') // <<< MAKE SURE this table name ('profiles') is correct!
                  ->onDelete('cascade'); // Optional: Define what happens if the profile is deleted

            // Add an index for better performance on lookups involving profile_id
            $table->index('profile_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbox');
    }
};